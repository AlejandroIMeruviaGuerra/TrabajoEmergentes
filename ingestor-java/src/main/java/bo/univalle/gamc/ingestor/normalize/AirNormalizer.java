package bo.univalle.gamc.ingestor.normalize;

import bo.univalle.gamc.ingestor.core.SensorRecord;
import java.util.*;

public class AirNormalizer implements Normalizer {

  private Double toD(String s){
    try { return (s==null || s.isBlank()) ? null : Double.parseDouble(s); }
    catch(Exception e){ return null; }
  }

  private Integer toI(String s){
    try { return (s==null || s.isBlank()) ? null : Integer.parseInt(s); }
    catch(Exception e){ return null; }
  }

  @Override
  public SensorRecord normalize(Map<String,String> m){

    SensorRecord s = new SensorRecord();   // 👈 tu clase solo soporta esto
    s.type = SensorRecord.Type.AIR;
    s.id   = m.getOrDefault("_id", m.getOrDefault("id", ""));
    s.time = m.getOrDefault("time", m.getOrDefault("Time", ""));

    // ---- Device info ----
    Map<String,Object> device = new HashMap<>();
    device.put("devEui",       m.get("deviceInfo.devEui"));
    device.put("name",         m.get("deviceInfo.deviceName"));
    device.put("profile",      m.get("deviceInfo.deviceProfileName"));
    device.put("tenant",       m.get("deviceInfo.tenantName"));
    device.put("application",  m.get("deviceInfo.applicationName"));
    s.device = device;

    // ---- Location ----
    Map<String,Object> loc = new HashMap<>();
    loc.put("address", m.get("deviceInfo.tags.Address"));

    String locStr = m.getOrDefault("deviceInfo.tags.Location", "");
    String[] parts = locStr.split(",");
    if(parts.length == 2) {
      try { loc.put("lat", Double.parseDouble(parts[0].trim())); } catch(Exception ignored){}
      try { loc.put("lng", Double.parseDouble(parts[1].trim())); } catch(Exception ignored){}
    }
    s.location = loc;

    // ---- Radio ----
    Map<String,Object> radio = new HashMap<>();
    radio.put("sf", toI(m.get("txInfo.modulation.lora.spreadingFactor")));
    radio.put("bw", toI(m.get("txInfo.modulation.lora.bandwidth")));
    radio.put("dr", toI(m.get("dr")));
    s.radio = radio;

    // ---- Measures ----
    Map<String,Object> measures = new HashMap<>();
    measures.put("co2",          toD(m.get("object.co2")));
    measures.put("temperature",  toD(m.get("object.temperature")));
    measures.put("humidity",     toD(m.get("object.humidity")));
    measures.put("pressure",     toD(m.get("object.pressure")));
    s.measures = measures;

    // ---- Labels (solo aire) ----
    Map<String,Object> labels = new HashMap<>();
    labels.put("co2_status",            m.get("object.co2_status"));
    labels.put("co2_message",           m.get("object.co2_message"));
    labels.put("temperature_message",   m.get("object.temperature_message"));
    labels.put("humidity_message",      m.get("object.humidity_message"));
    labels.put("pressure_status",       m.get("object.pressure_status"));
    s.labels = labels;

    return s;
  }
}
