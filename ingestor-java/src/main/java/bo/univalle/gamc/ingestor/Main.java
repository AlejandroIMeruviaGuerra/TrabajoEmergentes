package bo.univalle.gamc.ingestor;

import bo.univalle.gamc.ingestor.core.CsvIngestor;
import bo.univalle.gamc.ingestor.normalize.*;
import bo.univalle.gamc.ingestor.observers.KafkaPublisherObserver;
import org.apache.kafka.clients.producer.ProducerConfig;

import java.io.InputStream;
import java.nio.file.Path;
import java.util.Properties;

public class Main {
  public static void main(String[] args) throws Exception {
    // 1) Carga properties (defaults)
    Properties fileProps = new Properties();
    try (InputStream in = Main.class.getClassLoader().getResourceAsStream("application.properties")) {
      if (in != null) fileProps.load(in);
    }

    // 2) ENV overrides (brokers + csvs)
    String brokers = getenv("KAFKA_BROKERS", fileProps.getProperty("bootstrap.servers", "localhost:9092"));
    String airCsv  = getenv("CSV_AIR",  fileProps.getProperty("csv.air", ""));
    String noiseCsv= getenv("CSV_NOISE",fileProps.getProperty("csv.noise", ""));
    String undCsv  = getenv("CSV_UND",  fileProps.getProperty("csv.und", ""));

    // 3) Producer props (mezcla fileProps + defaults)
    Properties props = new Properties();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, brokers);
    props.put(ProducerConfig.ACKS_CONFIG, fileProps.getProperty("acks","all"));
    props.put(ProducerConfig.LINGER_MS_CONFIG, fileProps.getProperty("linger.ms","25"));
    props.put(ProducerConfig.BATCH_SIZE_CONFIG, fileProps.getProperty("batch.size","262144"));
    props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, fileProps.getProperty("compression.type","gzip"));
    props.put(ProducerConfig.RETRIES_CONFIG, fileProps.getProperty("retries","10"));
    props.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, fileProps.getProperty("request.timeout.ms","30000"));
    props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, fileProps.getProperty("enable.idempotence","true"));
    props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, fileProps.getProperty("max.in.flight.requests.per.connection","5"));
    props.put("retry.backoff.ms", fileProps.getProperty("retry.backoff.ms","250"));
    props.put("buffer.memory", fileProps.getProperty("buffer.memory","33554432"));

    // 4) Pasar topics a props (para el observer)
    props.put("topic.air",  fileProps.getProperty("topic.air","sensores.air"));
    props.put("topic.noise",fileProps.getProperty("topic.noise","sensores.noise"));
    props.put("topic.underground", fileProps.getProperty("topic.underground","sensores.underground"));

    KafkaPublisherObserver kafkaObs = new KafkaPublisherObserver(props);

    // 5) Ingestores (solo si hay CSV asignado)
    if (!airCsv.isBlank()) {
      CsvIngestor airIngestor = new CsvIngestor(Path.of(airCsv), new AirNormalizer());
      airIngestor.addObserver(kafkaObs);
      airIngestor.run();
    }
    if (!noiseCsv.isBlank()) {
      CsvIngestor noiseIngestor = new CsvIngestor(Path.of(noiseCsv), new NoiseNormalizer());
      noiseIngestor.addObserver(kafkaObs);
      noiseIngestor.run();
    }
    if (!undCsv.isBlank()) {
      CsvIngestor undIngestor = new CsvIngestor(Path.of(undCsv), new UndergroundNormalizer());
      undIngestor.addObserver(kafkaObs);
      undIngestor.run();
    }

    kafkaObs.close();
    System.out.println("✅ Ingesta finalizada");
  }

  private static String getenv(String k, String def){
    String v = System.getenv(k);
    return (v != null && !v.isBlank()) ? v : def;
  }
}
