package bo.univalle.gamc.ingestor.observers;

import bo.univalle.gamc.ingestor.core.Observer;
import bo.univalle.gamc.ingestor.core.SensorRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.producer.*;

import java.util.Properties;

public class KafkaPublisherObserver implements Observer {
  private final KafkaProducer<String,String> producer;
  private final ObjectMapper mapper = new ObjectMapper();
  private final String topicAir;
  private final String topicNoise;
  private final String topicUnd;
  private long count = 0;
  private final long flushEvery;

  public KafkaPublisherObserver(Properties props) {
    // Asegura serializadores si no vinieron en props
    props.putIfAbsent(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
    props.putIfAbsent(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
    this.producer = new KafkaProducer<>(props);

    this.topicAir  = props.getProperty("topic.air", "sensores.air");
    this.topicNoise= props.getProperty("topic.noise", "sensores.noise");
    this.topicUnd  = props.getProperty("topic.underground", "sensores.underground");

    // flush defensivo cada N (evita overflow en archivos grandes)
    this.flushEvery = 5000;
  }

  @Override
  public void update(SensorRecord record) {
    try {
      final String topic = switch (record.type) {
        case AIR -> topicAir;
        case NOISE -> topicNoise;
        case UNDERGROUND -> topicUnd;
      };

      // particionamiento por devEui (si no hay, cae a id o "unk")
      String key = null;
      if (record.device != null && record.device.get("devEui") != null) {
        key = record.device.get("devEui").asText();
      } else if (record.id != null) {
        key = record.id;
      } else {
        key = "unk";
      }

      final String value = mapper.writeValueAsString(record);
      producer.send(new ProducerRecord<>(topic, key, value), (md, ex) -> {
        if (ex != null) {
          ex.printStackTrace(); // aquí podrías contar errores si quieres métricas
        }
      });

      if (++count % flushEvery == 0) producer.flush();

    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  public void flush(){ producer.flush(); }
  public void close(){ producer.flush(); producer.close(); }
}
