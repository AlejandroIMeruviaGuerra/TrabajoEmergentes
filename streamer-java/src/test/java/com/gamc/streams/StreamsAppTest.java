package com.gamc.streams;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.*;
// import org.apache.kafka.streams.test.TestInputTopic;
// import org.apache.kafka.streams.test.TestOutputTopic;
import org.apache.kafka.streams.TestInputTopic;
import org.apache.kafka.streams.TestOutputTopic;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;

public class StreamsAppTest {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  // ===================== AIR ======================
  @Test
  void airAggregation_1MinWindow_outOfOrderEvents() throws Exception {
    Properties props = new Properties();
    props.put(StreamsConfig.APPLICATION_ID_CONFIG, "test-air");
    props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "dummy:9092");
    props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
    props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

    Topology topology = StreamsApp.buildTopology();

    try (TopologyTestDriver driver = new TopologyTestDriver(topology, props)) {

      TestInputTopic<String, String> airIn =
        driver.createInputTopic(
          "sensores.air",
          Serdes.String().serializer(),
          Serdes.String().serializer()
        );

      TestOutputTopic<String, String> airOut =
        driver.createOutputTopic(
          "sensores.air.avg1m",
          Serdes.String().deserializer(),
          Serdes.String().deserializer()
        );

      String devEui = "ABC123";
      String location = "Plaza Principal";

      // Tiempos en ms (ventana 0-60s)
      long t0  = 0L;
      long t20 = 20_000L;
      long t40 = 40_000L;
      long t10 = 10_000L; // fuera de orden

      // media esperada = (400 + 600 + 800 + 200) / 4 = 500
      airIn.pipeInput(devEui, buildAirRecord(devEui, location, 400, 20, 50, 900), t0);
      airIn.pipeInput(devEui, buildAirRecord(devEui, location, 600, 22, 55, 910), t20);
      airIn.pipeInput(devEui, buildAirRecord(devEui, location, 800, 24, 60, 920), t40);
      airIn.pipeInput(devEui, buildAirRecord(devEui, location, 200, 18, 45, 890), t10);

      List<KeyValue<String, String>> results = airOut.readKeyValuesToList();
      assertFalse(results.isEmpty(), "Debe haber mensajes en sensores.air.avg1m");

      KeyValue<String, String> last = results.get(results.size() - 1);
      assertEquals(devEui, last.key);

      JsonNode json = MAPPER.readTree(last.value);

      assertEquals(devEui, json.get("devEui").asText());
      assertEquals(4, json.get("count").asInt());

      double avgCo2 = json.get("avgCo2").asDouble();
      double expectedAvg = (400 + 600 + 800 + 200) / 4.0;

      assertEquals(expectedAvg, avgCo2, 0.0001, "El promedio de CO2 debe coincidir");
      assertEquals(location, json.get("locationName").asText());
    }
  }

  // ===================== NOISE ======================
  @Test
  void noiseAggregation_1MinWindow_outOfOrderEvents() throws Exception {
    Properties props = new Properties();
    props.put(StreamsConfig.APPLICATION_ID_CONFIG, "test-noise");
    props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "dummy:9092");
    props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
    props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

    Topology topology = StreamsApp.buildTopology();

    try (TopologyTestDriver driver = new TopologyTestDriver(topology, props)) {

      TestInputTopic<String, String> noiseIn =
        driver.createInputTopic(
          "sensores.noise",
          Serdes.String().serializer(),
          Serdes.String().serializer()
        );

      TestOutputTopic<String, String> noiseOut =
        driver.createOutputTopic(
          "sensores.noise.avg1m",
          Serdes.String().deserializer(),
          Serdes.String().deserializer()
        );

      String devEui = "NOISE-01";
      String location = "Av. Blanco Galindo";

      long t0  = 0L;
      long t20 = 20_000L;
      long t40 = 40_000L;
      long t10 = 10_000L; // fuera de orden

      // media esperada = (70 + 80 + 90 + 60) / 4 = 75
      noiseIn.pipeInput(devEui, buildNoiseRecord(devEui, location, 70,  60, 75), t0);
      noiseIn.pipeInput(devEui, buildNoiseRecord(devEui, location, 80,  65, 85), t20);
      noiseIn.pipeInput(devEui, buildNoiseRecord(devEui, location, 90,  70, 95), t40);
      noiseIn.pipeInput(devEui, buildNoiseRecord(devEui, location, 60,  55, 65), t10);

      List<KeyValue<String, String>> results = noiseOut.readKeyValuesToList();
      assertFalse(results.isEmpty(), "Debe haber mensajes en sensores.noise.avg1m");

      KeyValue<String, String> last = results.get(results.size() - 1);
      assertEquals(devEui, last.key);

      JsonNode json = MAPPER.readTree(last.value);

      assertEquals(devEui, json.get("devEui").asText());
      assertEquals(4, json.get("count").asInt());

      double avgLaeq = json.get("avgLaeq").asDouble();
      double expectedAvg = (70 + 80 + 90 + 60) / 4.0;

      assertEquals(expectedAvg, avgLaeq, 0.0001, "El promedio de LAeq debe coincidir");
      assertEquals(location, json.get("locationName").asText());
    }
  }

  // ===================== UNDERGROUND ======================
  @Test
  void undergroundAggregation_1MinWindow_outOfOrderEvents() throws Exception {
    Properties props = new Properties();
    props.put(StreamsConfig.APPLICATION_ID_CONFIG, "test-underground");
    props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "dummy:9092");
    props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
    props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

    Topology topology = StreamsApp.buildTopology();

    try (TopologyTestDriver driver = new TopologyTestDriver(topology, props)) {

      TestInputTopic<String, String> undIn =
        driver.createInputTopic(
          "sensores.underground",
          Serdes.String().serializer(),
          Serdes.String().serializer()
        );

      TestOutputTopic<String, String> undOut =
        driver.createOutputTopic(
          "sensores.underground.avg1m",
          Serdes.String().deserializer(),
          Serdes.String().deserializer()
        );

      String devEui = "UND-01";
      String location = "Calle Sucre";

      long t0  = 0L;
      long t20 = 20_000L;
      long t40 = 40_000L;
      long t10 = 10_000L; // fuera de orden

      // media esperada = (10 + 20 + 30 + 40) / 4 = 25
      undIn.pipeInput(devEui, buildUndRecord(devEui, location, 10), t0);
      undIn.pipeInput(devEui, buildUndRecord(devEui, location, 20), t20);
      undIn.pipeInput(devEui, buildUndRecord(devEui, location, 30), t40);
      undIn.pipeInput(devEui, buildUndRecord(devEui, location, 40), t10);

      List<KeyValue<String, String>> results = undOut.readKeyValuesToList();
      assertFalse(results.isEmpty(), "Debe haber mensajes en sensores.underground.avg1m");

      KeyValue<String, String> last = results.get(results.size() - 1);
      assertEquals(devEui, last.key);

      JsonNode json = MAPPER.readTree(last.value);

      assertEquals(devEui, json.get("devEui").asText());
      assertEquals(4, json.get("count").asInt());

      double avgDistance = json.get("avgDistance").asDouble();
      double expectedAvg = (10 + 20 + 30 + 40) / 4.0;

      assertEquals(expectedAvg, avgDistance, 0.0001, "El promedio de distancia debe coincidir");
      assertEquals(location, json.get("locationName").asText());
    }
  }

  // ===================== BUILDERS DE JSON ======================

  private String buildAirRecord(String devEui,
                                String address,
                                double co2,
                                double temperature,
                                double humidity,
                                double pressure) throws Exception {
    var root = MAPPER.createObjectNode();
    root.put("time", System.currentTimeMillis());

    var device = root.putObject("device");
    device.put("devEui", devEui);

    var loc = root.putObject("location");
    loc.put("address", address);

    var measures = root.putObject("measures");
    measures.put("co2", co2);
    measures.put("temperature", temperature);
    measures.put("humidity", humidity);
    measures.put("pressure", pressure);

    return root.toString();
  }

  private String buildNoiseRecord(String devEui,
                                  String address,
                                  double laeq,
                                  double lai,
                                  double laimax) throws Exception {
    var root = MAPPER.createObjectNode();
    root.put("time", System.currentTimeMillis());

    var device = root.putObject("device");
    device.put("devEui", devEui);

    var loc = root.putObject("location");
    loc.put("address", address);

    var measures = root.putObject("measures");
    measures.put("laeq", laeq);
    measures.put("lai", lai);
    measures.put("laimax", laimax);

    return root.toString();
  }

  private String buildUndRecord(String devEui,
                                String address,
                                double distance) throws Exception {
    var root = MAPPER.createObjectNode();
    root.put("time", System.currentTimeMillis());

    var device = root.putObject("device");
    device.put("devEui", devEui);

    var loc = root.putObject("location");
    loc.put("address", address);

    var measures = root.putObject("measures");
    measures.put("distance", distance);

    return root.toString();
  }
}
