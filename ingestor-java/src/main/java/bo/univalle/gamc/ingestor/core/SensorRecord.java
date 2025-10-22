package bo.univalle.gamc.ingestor.core;
import java.util.Map;

public class SensorRecord {
  public enum Type { AIR, NOISE, UNDERGROUND }
  public Type type;
  public String id;
  public String time;
  public Map<String,Object> device;
  public Map<String,Object> location;
  public Map<String,Object> radio;
  public Map<String,Object> measures;
  public Map<String,Object> labels; // solo aire
}
