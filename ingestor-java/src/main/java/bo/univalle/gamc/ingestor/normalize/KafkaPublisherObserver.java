package bo.univalle.gamc.ingestor.observers;

import bo.univalle.gamc.ingestor.core.Observer;
import bo.univalle.gamc.ingestor.core.SensorRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.producer.*;
import java.util.Properties;

public class KafkaPublisherObserver implements Observer {
  private final KafkaProducer<String,String> producer;
  private final ObjectMapper mapper = new ObjectMapper();
  private long count = 0;

  public KafkaPublisherObserver(Properties props) {
    this.producer = new KafkaProducer<>(props);
  }

  @Override public void update(SensorRecord record) {
    try {
      String topic = switch (record.type) {
        case AIR -> "sensores.air";
        case NOISE -> "sensores.noise";
        case UNDERGROUND -> "sensores.underground";
      };
      String key = record.id != null ? record.id
                 : (record.device!=null && record.device.get("devEui")!=null ? record.device.get("devEui").toString() : "unk");
      String value = mapper.writeValueAsString(record);
      producer.send(new ProducerRecord<>(topic, key, value));
      
      // Flush every 5000 messages to avoid buffer overflow
      if (++count % 5000 == 0) {
        producer.flush();
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  public void flush(){ producer.flush(); }
  public void close(){ producer.flush(); producer.close(); }
}
