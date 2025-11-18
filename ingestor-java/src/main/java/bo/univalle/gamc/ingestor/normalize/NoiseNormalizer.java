package bo.univalle.gamc.ingestor.normalize;

import bo.univalle.gamc.ingestor.core.SensorRecord;
import java.util.*;

public class NoiseNormalizer implements Normalizer {
  private Double toD(String s){ try { return s==null||s.isBlank()? null: Double.parseDouble(s); } catch(Exception e){ return null; } }
  private Integer toI(String s){ try { return s==null||s.isBlank()? null: Integer.parseInt(s); } catch(Exception e){ return null; } }

  @Override public SensorRecord normalize(Map<String,String> m){
    SensorRecord s = new SensorRecord();
    s.type = SensorRecord.Type.NOISE;
    s.id   = m.getOrDefault("_id", m.getOrDefault("id",""));
    s.time = m.getOrDefault("time", m.getOrDefault("Time",""));

    Map<String,Object> device = new HashMap<>();
    String devEuiStr = m.get("deviceInfo.devEui");
    if (devEuiStr == null) devEuiStr = m.get("devEui");
    device.put("devEui", devEuiStr);
    device.put("name", m.get("deviceInfo.deviceName"));
    device.put("profile", m.get("deviceInfo.deviceProfileName"));
    s.device = device;

    Map<String,Object> loc = new HashMap<>();
    loc.put("address", m.get("deviceInfo.tags.Address"));
    String locStr = m.getOrDefault("deviceInfo.tags.Location", "");
    String[] parts = locStr.split(",");
    if (parts.length==2) {
      try { loc.put("lat", Double.parseDouble(parts[0].trim())); } catch(Exception ignored){}
      try { loc.put("lng", Double.parseDouble(parts[1].trim())); } catch(Exception ignored){}
    }
    s.location = loc;

    Map<String,Object> radio = new HashMap<>();
    radio.put("sf", toI(m.get("txInfo.modulation.lora.spreadingFactor")));
    radio.put("bw", toI(m.get("txInfo.modulation.lora.bandwidth")));
    radio.put("dr", toI(m.get("dr")));
    s.radio = radio;

    Map<String,Object> measures = new HashMap<>();
    String laeqStr = m.get("object.LAeq");
    if (laeqStr == null) laeqStr = m.get("LAeq");
    String laiStr = m.get("object.LAI");
    if (laiStr == null) laiStr = m.get("LAI");
    String laimaxStr = m.get("object.LAImax");
    if (laimaxStr == null) laimaxStr = m.get("LAImax");
    
    measures.put("laeq", toD(laeqStr));
    measures.put("lai", toD(laiStr));
    measures.put("laimax", toD(laimaxStr));
    s.measures = measures;

    // en noise los CSV traen batería/estado como object.battery/status
    String batteryStr = m.get("object.battery");
    if (batteryStr == null) batteryStr = m.get("battery");
    String statusStr = m.get("object.status");
    if (statusStr == null) statusStr = m.get("status");
    
    s.device.put("battery", toD(batteryStr));
    s.device.put("status", statusStr);
    return s;
  }
}
