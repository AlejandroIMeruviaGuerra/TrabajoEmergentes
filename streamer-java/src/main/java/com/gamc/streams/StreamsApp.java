package com.gamc.streams;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.StreamsConfig;
import org.apache.kafka.streams.Topology;
import org.apache.kafka.streams.kstream.*;
import org.apache.kafka.streams.KeyValue;

import java.time.Duration;
import java.util.Properties;

public class StreamsApp {

  static final ObjectMapper MAPPER = new ObjectMapper();

  public static void main(String[] args) {
    Properties p = defaultConfig();

    Topology topology = buildTopology();
    KafkaStreams streams = new KafkaStreams(topology, p);

    streams.start();
    Runtime.getRuntime().addShutdownHook(new Thread(streams::close));
  }

  // ==================== CONFIG POR DEFECTO ====================
  private static Properties defaultConfig() {
    Properties p = new Properties();
    p.put(StreamsConfig.APPLICATION_ID_CONFIG,
        System.getProperty("application.id", "gamc-streams"));
    p.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG,
        System.getProperty("bootstrap.servers", "localhost:9092"));
    p.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
    p.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
    return p;
  }

  // ==================== TOPOLOGÍA (para main y para tests) ====================
  public static Topology buildTopology() {
    StreamsBuilder builder = new StreamsBuilder();
    buildTopology(builder);
    return builder.build();
  }

  static void buildTopology(StreamsBuilder b) {
    // ---- Input topics en crudo (JSON de SensorRecord) ----
    KStream<String, String> air   = b.stream("sensores.air");
    KStream<String, String> noise = b.stream("sensores.noise");
    KStream<String, String> und   = b.stream("sensores.underground");

    // Ventana tumbling de 1 minuto con 30s de gracia (tolerancia a desorden)
    Duration win   = Duration.ofMinutes(1);
    Duration grace = Duration.ofSeconds(30);
    TimeWindows tumbling = TimeWindows.ofSizeAndGrace(win, grace);

    // ======================= AIR =======================
    air
      // key = devEui
      .selectKey((k, v) -> extractDevEui(v))
      .filter((k, v) -> k != null)
      // convertir a JSON compacto con solo lo necesario
      .mapValues(StreamsApp::extractAirMeasures) // {co2,temperature,humidity,pressure,ts,locationName}
      .filter((k, v) -> v != null)
      .groupByKey()
      .windowedBy(tumbling)
      .aggregate(
        StreamsApp::emptyAirAgg,                               // valor inicial
        (key, val, agg) -> mergeAir(agg, val),                 // acumulador
        Materialized.with(Serdes.String(), Serdes.String())
      )
      .toStream()
      // salida: key=devEui, value=json con promedios y ventana
      .map((windowedKey, aggJson) -> {
        String devEui = windowedKey.key();
        long start = windowedKey.window().start();
        long end   = windowedKey.window().end();
        String outJson = finalizeAir(devEui, start, end, aggJson);
        return KeyValue.pair(devEui, outJson);
      })
      .to("sensores.air.avg1m");

    // ======================= NOISE =======================
    noise
      .selectKey((k, v) -> extractDevEui(v))
      .filter((k, v) -> k != null)
      .mapValues(StreamsApp::extractNoiseMeasures) // {laeq,lai,laimax,ts,locationName}
      .filter((k, v) -> v != null)
      .groupByKey()
      .windowedBy(tumbling)
      .aggregate(
        StreamsApp::emptyNoiseAgg,
        (key, val, agg) -> mergeNoise(agg, val),
        Materialized.with(Serdes.String(), Serdes.String())
      )
      .toStream()
      .map((windowedKey, aggJson) -> {
        String devEui = windowedKey.key();
        long start = windowedKey.window().start();
        long end   = windowedKey.window().end();
        String outJson = finalizeNoise(devEui, start, end, aggJson);
        return KeyValue.pair(devEui, outJson);
      })
      .to("sensores.noise.avg1m");

    // ======================= UNDERGROUND =======================
    und
      .selectKey((k, v) -> extractDevEui(v))
      .filter((k, v) -> k != null)
      .mapValues(StreamsApp::extractUndMeasures) // {distance,ts,locationName}
      .filter((k, v) -> v != null)
      .groupByKey()
      .windowedBy(tumbling)
      .aggregate(
        StreamsApp::emptyUndAgg,
        (key, val, agg) -> mergeUnd(agg, val),
        Materialized.with(Serdes.String(), Serdes.String())
      )
      .toStream()
      .map((windowedKey, aggJson) -> {
        String devEui = windowedKey.key();
        long start = windowedKey.window().start();
        long end   = windowedKey.window().end();
        String outJson = finalizeUnd(devEui, start, end, aggJson);
        return KeyValue.pair(devEui, outJson);
      })
      .to("sensores.underground.avg1m");
  }

  // ====================== HELPERS DE PARSEO ======================
  static String extractDevEui(String json) {
    try {
      JsonNode n = MAPPER.readTree(json);
      return n.path("device").path("devEui").asText(null);
    } catch (Exception e) {
      return null;
    }
  }

  static String extractAirMeasures(String json) {
    try {
      JsonNode n = MAPPER.readTree(json);
      JsonNode m = n.path("measures");
      String loc = n.path("location").path("address").asText("");
      long ts = n.path("time").isNumber()
        ? n.path("time").asLong()
        : n.path("time").asText("").hashCode();
      double co2 = m.path("co2").asDouble(Double.NaN);
      double t   = m.path("temperature").asDouble(Double.NaN);
      double h   = m.path("humidity").asDouble(Double.NaN);
      double p   = m.path("pressure").asDouble(Double.NaN);
      ObjectNode out = MAPPER.createObjectNode();
      out.put("co2", co2);
      out.put("temperature", t);
      out.put("humidity", h);
      out.put("pressure", p);
      out.put("ts", ts);
      out.put("locationName", loc);
      return out.toString();
    } catch (Exception e) {
      return null;
    }
  }

  static String extractNoiseMeasures(String json) {
    try {
      JsonNode n = MAPPER.readTree(json);
      JsonNode m = n.path("measures");
      String loc = n.path("location").path("address").asText("");
      long ts = n.path("time").isNumber()
        ? n.path("time").asLong()
        : n.path("time").asText("").hashCode();
      double laeq  = m.path("laeq").asDouble(Double.NaN);
      double lai   = m.path("lai").asDouble(Double.NaN);
      double laimax= m.path("laimax").asDouble(Double.NaN);
      ObjectNode out = MAPPER.createObjectNode();
      out.put("laeq", laeq);
      out.put("lai", lai);
      out.put("laimax", laimax);
      out.put("ts", ts);
      out.put("locationName", loc);
      return out.toString();
    } catch (Exception e) {
      return null;
    }
  }

  static String extractUndMeasures(String json) {
    try {
      JsonNode n = MAPPER.readTree(json);
      JsonNode m = n.path("measures");
      String loc = n.path("location").path("address").asText("");
      long ts = n.path("time").isNumber()
        ? n.path("time").asLong()
        : n.path("time").asText("").hashCode();
      double d = m.path("distance").asDouble(Double.NaN);
      ObjectNode out = MAPPER.createObjectNode();
      out.put("distance", d);
      out.put("ts", ts);
      out.put("locationName", loc);
      return out.toString();
    } catch (Exception e) {
      return null;
    }
  }

  // ====================== AGREGADORES (sum + count) ======================
  // guardamos el estado como JSON de texto para no crear Serde custom

  // -------- AIR --------
  static String emptyAirAgg() {
    // también cargamos locationName, que se setea cuando llegue el primer valor no vacío
    return "{\"sum_co2\":0,\"sum_t\":0,\"sum_h\":0,\"sum_p\":0,\"count\":0,\"locationName\":\"\"}";
  }

  static String mergeAir(String aggJson, String vJson) {
    try {
      JsonNode agg = MAPPER.readTree(aggJson);
      JsonNode v   = MAPPER.readTree(vJson);

      double co2 = safe(v, "co2");
      double t   = safe(v, "temperature");
      double h   = safe(v, "humidity");
      double p   = safe(v, "pressure");

      long c = agg.path("count").asLong();
      double sc = agg.path("sum_co2").asDouble() + (Double.isNaN(co2) ? 0 : co2);
      double st = agg.path("sum_t").asDouble()   + (Double.isNaN(t)   ? 0 : t);
      double sh = agg.path("sum_h").asDouble()   + (Double.isNaN(h)   ? 0 : h);
      double sp = agg.path("sum_p").asDouble()   + (Double.isNaN(p)   ? 0 : p);
      long nc   = c + 1;

      String locAgg = agg.path("locationName").asText("");
      String locNew = v.path("locationName").asText("");
      String locFinal = locAgg.isEmpty() ? locNew : locAgg;

      ObjectNode out = MAPPER.createObjectNode();
      out.put("sum_co2", sc);
      out.put("sum_t", st);
      out.put("sum_h", sh);
      out.put("sum_p", sp);
      out.put("count", nc);
      out.put("locationName", locFinal == null ? "" : locFinal);
      return out.toString();
    } catch (Exception e) {
      return aggJson;
    }
  }

  static String finalizeAir(String devEui, long start, long end, String aggJson) {
    try {
      JsonNode agg = MAPPER.readTree(aggJson);
      long count = agg.path("count").asLong(0);
      if (count == 0) return null;

      double avgCo2 = agg.path("sum_co2").asDouble() / count;
      double avgT   = agg.path("sum_t").asDouble()   / count;
      double avgH   = agg.path("sum_h").asDouble()   / count;
      double avgP   = agg.path("sum_p").asDouble()   / count;
      String loc    = agg.path("locationName").asText("");

      ObjectNode out = MAPPER.createObjectNode();
      out.put("devEui", devEui);
      out.put("windowStart", start);
      out.put("windowEnd", end);
      out.put("locationName", loc);
      out.put("avgCo2", avgCo2);
      out.put("avgTemperature", avgT);
      out.put("avgHumidity", avgH);
      out.put("avgPressure", avgP);
      out.put("count", count);
      return out.toString();
    } catch (Exception e) {
      return null;
    }
  }

  // -------- NOISE --------
  static String emptyNoiseAgg() {
    return "{\"sum_laeq\":0,\"sum_lai\":0,\"sum_laimax\":0,\"count\":0,\"locationName\":\"\"}";
  }

  static String mergeNoise(String aggJson, String vJson) {
    try {
      JsonNode agg = MAPPER.readTree(aggJson);
      JsonNode v   = MAPPER.readTree(vJson);

      double a  = safe(v, "laeq");
      double i  = safe(v, "lai");
      double mx = safe(v, "laimax");

      long c = agg.path("count").asLong();
      double sa = agg.path("sum_laeq").asDouble()  + (Double.isNaN(a)  ? 0 : a);
      double si = agg.path("sum_lai").asDouble()   + (Double.isNaN(i)  ? 0 : i);
      double sm = agg.path("sum_laimax").asDouble()+ (Double.isNaN(mx) ? 0 : mx);
      long nc   = c + 1;

      String locAgg = agg.path("locationName").asText("");
      String locNew = v.path("locationName").asText("");
      String locFinal = locAgg.isEmpty() ? locNew : locAgg;

      ObjectNode out = MAPPER.createObjectNode();
      out.put("sum_laeq", sa);
      out.put("sum_lai", si);
      out.put("sum_laimax", sm);
      out.put("count", nc);
      out.put("locationName", locFinal == null ? "" : locFinal);
      return out.toString();
    } catch (Exception e) {
      return aggJson;
    }
  }

  static String finalizeNoise(String devEui, long start, long end, String aggJson) {
    try {
      JsonNode agg = MAPPER.readTree(aggJson);
      long count = agg.path("count").asLong(0);
      if (count == 0) return null;

      double avgLaeq  = agg.path("sum_laeq").asDouble()  / count;
      double avgLai   = agg.path("sum_lai").asDouble()   / count;
      double avgLaimax= agg.path("sum_laimax").asDouble()/ count;
      String loc      = agg.path("locationName").asText("");

      ObjectNode out = MAPPER.createObjectNode();
      out.put("devEui", devEui);
      out.put("windowStart", start);
      out.put("windowEnd", end);
      out.put("locationName", loc);
      out.put("avgLaeq", avgLaeq);
      out.put("avgLai", avgLai);
      out.put("avgLaimax", avgLaimax);
      out.put("count", count);
      return out.toString();
    } catch (Exception e) {
      return null;
    }
  }

  // -------- UNDERGROUND --------
  static String emptyUndAgg() {
    return "{\"sum_distance\":0,\"count\":0,\"locationName\":\"\"}";
  }

  static String mergeUnd(String aggJson, String vJson) {
    try {
      JsonNode agg = MAPPER.readTree(aggJson);
      JsonNode v   = MAPPER.readTree(vJson);

      double d = safe(v, "distance");

      long c = agg.path("count").asLong();
      double sd = agg.path("sum_distance").asDouble() + (Double.isNaN(d) ? 0 : d);
      long nc   = c + 1;

      String locAgg = agg.path("locationName").asText("");
      String locNew = v.path("locationName").asText("");
      String locFinal = locAgg.isEmpty() ? locNew : locAgg;

      ObjectNode out = MAPPER.createObjectNode();
      out.put("sum_distance", sd);
      out.put("count", nc);
      out.put("locationName", locFinal == null ? "" : locFinal);
      return out.toString();
    } catch (Exception e) {
      return aggJson;
    }
  }

  static String finalizeUnd(String devEui, long start, long end, String aggJson) {
    try {
      JsonNode agg = MAPPER.readTree(aggJson);
      long count = agg.path("count").asLong(0);
      if (count == 0) return null;

      double avgDistance = agg.path("sum_distance").asDouble() / count;
      String loc = agg.path("locationName").asText("");

      ObjectNode out = MAPPER.createObjectNode();
      out.put("devEui", devEui);
      out.put("windowStart", start);
      out.put("windowEnd", end);
      out.put("locationName", loc);
      out.put("avgDistance", avgDistance);
      out.put("count", count);
      return out.toString();
    } catch (Exception e) {
      return null;
    }
  }

  // ====================== UTILIDAD ======================
  static double safe(JsonNode n, String f) {
    return n.path(f).isNumber() ? n.path(f).asDouble() : Double.NaN;
  }
}
