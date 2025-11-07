package com.gamc.streams;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.*;
import org.apache.kafka.streams.kstream.*;

import java.time.Duration;
import java.util.Properties;

public class StreamsApp {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  public static void main(String[] args) {
    Properties p = new Properties();
    p.put(StreamsConfig.APPLICATION_ID_CONFIG, System.getProperty("application.id","gamc-streams"));
    p.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, System.getProperty("bootstrap.servers","localhost:9092"));
    p.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
    p.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

    StreamsBuilder b = new StreamsBuilder();

    // ---- Input topics
    KStream<String, String> air  = b.stream("sensores.air");
    KStream<String, String> noise = b.stream("sensores.noise");
    KStream<String, String> und  = b.stream("sensores.underground");

    // Ventana tumbling 1 min con 30s de gracia
    Duration win = Duration.ofMinutes(1);
    Duration grace = Duration.ofSeconds(30);
    TimeWindows tumbling = TimeWindows.ofSizeWithNoGrace(win).grace(grace);

    // ========== AIR: avg(co2, temp, hum, press) por devEui ==========
    air
      .selectKey((k,v) -> extractDevEui(v)) // key = devEui
      .filter((k,v) -> k != null)
      .mapValues(v -> extractAirMeasures(v)) // JSON compacto con {co2,temperature,humidity,pressure,ts,locationName}
      .filter((k,v) -> v != null)
      .groupByKey()
      .windowedBy(tumbling)
      .aggregate(
        StreamsApp::emptyAirAgg,
        (key, val, agg) -> mergeAir(agg, val),
        Materialized.with(Serdes.String(), Serdes.String())
      )
      .toStream()
      .map((wk, v) -> KeyValue.pair(wk.key(), v))
      .to("sensores.air.avg1m");

    // ========== NOISE: avg(laeq,lai,laimax) por devEui ==========
    noise
      .selectKey((k,v) -> extractDevEui(v))
      .filter((k,v) -> k != null)
      .mapValues(v -> extractNoiseMeasures(v)) // {laeq,lai,laimax,ts,locationName}
      .filter((k,v) -> v != null)
      .groupByKey()
      .windowedBy(tumbling)
      .aggregate(
        StreamsApp::emptyNoiseAgg,
        (key, val, agg) -> mergeNoise(agg, val),
        Materialized.with(Serdes.String(), Serdes.String())
      )
      .toStream()
      .map((wk, v) -> KeyValue.pair(wk.key(), v))
      .to("sensores.noise.avg1m");

    // ========== UNDERGROUND: avg(distance) por devEui ==========
    und
      .selectKey((k,v) -> extractDevEui(v))
      .filter((k,v) -> k != null)
      .mapValues(v -> extractUndMeasures(v)) // {distance,ts,locationName}
      .filter((k,v) -> v != null)
      .groupByKey()
      .windowedBy(tumbling)
      .aggregate(
        StreamsApp::emptyUndAgg,
        (key, val, agg) -> mergeUnd(agg, val),
        Materialized.with(Serdes.String(), Serdes.String())
      )
      .toStream()
      .map((wk, v) -> KeyValue.pair(wk.key(), v))
      .to("sensores.underground.avg1m");

    KafkaStreams streams = new KafkaStreams(b.build(), p);
    streams.start();
    Runtime.getRuntime().addShutdownHook(new Thread(streams::close));
  }

  // -------- helpers de parseo -----------
  static String extractDevEui(String json) {
    try {
      JsonNode n = MAPPER.readTree(json);
      return n.path("device").path("devEui").asText(null);
    } catch (Exception e) { return null; }
  }

  static String extractAirMeasures(String json) {
    try {
      JsonNode n = MAPPER.readTree(json);
      JsonNode m = n.path("measures");
      String loc = n.path("location").path("address").asText("");
      long ts = n.path("time").isNumber() ? n.path("time").asLong() : n.path("time").asText("").hashCode();
      double co2 = m.path("co2").asDouble(Double.NaN);
      double t   = m.path("temperature").asDouble(Double.NaN);
      double h   = m.path("humidity").asDouble(Double.NaN);
      double p   = m.path("pressure").asDouble(Double.NaN);
      return MAPPER.createObjectNode()
        .put("co2", co2).put("temperature", t).put("humidity", h).put("pressure", p)
        .put("ts", ts).put("locationName", loc)
        .toString();
    } catch (Exception e) { return null; }
  }

  static String extractNoiseMeasures(String json) {
    try {
      JsonNode n = MAPPER.readTree(json);
      JsonNode m = n.path("measures");
      String loc = n.path("location").path("address").asText("");
      long ts = n.path("time").isNumber() ? n.path("time").asLong() : n.path("time").asText("").hashCode();
      double laeq = m.path("laeq").asDouble(Double.NaN);
      double lai  = m.path("lai").asDouble(Double.NaN);
      double laimax = m.path("laimax").asDouble(Double.NaN);
      return MAPPER.createObjectNode()
        .put("laeq", laeq).put("lai", lai).put("laimax", laimax)
        .put("ts", ts).put("locationName", loc)
        .toString();
    } catch (Exception e) { return null; }
  }

  static String extractUndMeasures(String json) {
    try {
      JsonNode n = MAPPER.readTree(json);
      JsonNode m = n.path("measures");
      String loc = n.path("location").path("address").asText("");
      long ts = n.path("time").isNumber() ? n.path("time").asLong() : n.path("time").asText("").hashCode();
      double d = m.path("distance").asDouble(Double.NaN);
      return MAPPER.createObjectNode()
        .put("distance", d).put("ts", ts).put("locationName", loc)
        .toString();
    } catch (Exception e) { return null; }
  }

  // -------- agregadores simples: sum + count -> avg al final ----------
  static String emptyAirAgg() {
    return "{\"sum_co2\":0,\"sum_t\":0,\"sum_h\":0,\"sum_p\":0,\"count\":0}";
  }
  static String mergeAir(String aggJson, String vJson) {
    try {
      JsonNode agg = MAPPER.readTree(aggJson);
      JsonNode v = MAPPER.readTree(vJson);
      double co2 = safe(v,"co2");
      double t   = safe(v,"temperature");
      double h   = safe(v,"humidity");
      double p   = safe(v,"pressure");
      long c = agg.path("count").asLong();
      double sc = agg.path("sum_co2").asDouble() + (Double.isNaN(co2)?0:co2);
      double st = agg.path("sum_t").asDouble()   + (Double.isNaN(t)?0:t);
      double sh = agg.path("sum_h").asDouble()   + (Double.isNaN(h)?0:h);
      double sp = agg.path("sum_p").asDouble()   + (Double.isNaN(p)?0:p);
      long nc = c + 1;
      return MAPPER.createObjectNode()
        .put("sum_co2", sc).put("sum_t", st).put("sum_h", sh).put("sum_p", sp).put("count", nc)
        .toString();
    } catch (Exception e) { return aggJson; }
  }

  static String emptyNoiseAgg() {
    return "{\"sum_laeq\":0,\"sum_lai\":0,\"sum_laimax\":0,\"count\":0}";
  }
  static String mergeNoise(String aggJson, String vJson) {
    try {
      JsonNode agg = MAPPER.readTree(aggJson);
      JsonNode v = MAPPER.readTree(vJson);
      double a = safe(v,"laeq"), i = safe(v,"lai"), mx = safe(v,"laimax");
      long c = agg.path("count").asLong();
      double sa = agg.path("sum_laeq").asDouble()  + (Double.isNaN(a)?0:a);
      double si = agg.path("sum_lai").asDouble()   + (Double.isNaN(i)?0:i);
      double sm = agg.path("sum_laimax").asDouble()+ (Double.isNaN(mx)?0:mx);
      long nc = c + 1;
      return MAPPER.createObjectNode()
        .put("sum_laeq", sa).put("sum_lai", si).put("sum_laimax", sm).put("count", nc)
        .toString();
    } catch (Exception e) { return aggJson; }
  }

  static String emptyUndAgg() {
    return "{\"sum_distance\":0,\"count\":0}";
  }
  static String mergeUnd(String aggJson, String vJson) {
    try {
      JsonNode agg = MAPPER.readTree(aggJson);
      JsonNode v = MAPPER.readTree(vJson);
      double d = safe(v,"distance");
      long c = agg.path("count").asLong();
      double sd = agg.path("sum_distance").asDouble() + (Double.isNaN(d)?0:d);
      long nc = c + 1;
      return MAPPER.createObjectNode()
        .put("sum_distance", sd).put("count", nc).toString();
    } catch (Exception e) { return aggJson; }
  }

  static double safe(JsonNode n, String f) {
    return n.path(f).isNumber() ? n.path(f).asDouble() : Double.NaN;
  }
}
