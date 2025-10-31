package bo.univalle.gamc.ingestor.normalize;
import bo.univalle.gamc.ingestor.core.SensorRecord;
import java.util.Map;

public interface Normalizer {
  SensorRecord normalize(Map<String, String> row);
}
