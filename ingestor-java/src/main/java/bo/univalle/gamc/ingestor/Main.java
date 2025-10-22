package bo.univalle.gamc.ingestor;

import bo.univalle.gamc.ingestor.core.CsvIngestor;
import bo.univalle.gamc.ingestor.normalize.*;
import bo.univalle.gamc.ingestor.observers.KafkaPublisherObserver;
import java.nio.file.Path;
import java.util.Properties;
import org.apache.kafka.clients.producer.ProducerConfig;

public class Main {
  public static void main(String[] args) throws Exception {
    // Variables de entorno o usa rutas por defecto
    String brokers = getenv("KAFKA_BROKERS", "localhost:9092");
    String airCsv  = getenv("CSV_AIR",  "data/aire.csv");
    String noiseCsv= getenv("CSV_NOISE","data/ruido.csv");
    String undCsv  = getenv("CSV_UND",  "data/soterrado.csv");

    // Kafka producer
    Properties props = new Properties();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, brokers);
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
    props.put(ProducerConfig.ACKS_CONFIG, "1");

    KafkaPublisherObserver kafkaObs = new KafkaPublisherObserver(props);

    CsvIngestor airIngestor   = new CsvIngestor(Path.of(airCsv),   new AirNormalizer());
    CsvIngestor noiseIngestor = new CsvIngestor(Path.of(noiseCsv), new NoiseNormalizer());
    CsvIngestor undIngestor   = new CsvIngestor(Path.of(undCsv),   new UndergroundNormalizer());

    airIngestor.addObserver(kafkaObs);
    noiseIngestor.addObserver(kafkaObs);
    undIngestor.addObserver(kafkaObs);

    airIngestor.run();
    noiseIngestor.run();
    undIngestor.run();

    kafkaObs.close();
    System.out.println("✅ Ingesta finalizada");
  }

  private static String getenv(String k, String def){ String v = System.getenv(k); return v!=null && !v.isBlank()? v : def; }
}
