package bo.univalle.gamc.ingestor.core;

import java.io.InputStream;
import java.util.Map;
import java.util.Properties;

public class Config {
  private final Properties p = new Properties();

  public static Config load(String[] args) {
    Config c = new Config();
    c.loadDefaults();
    c.applyEnv();
    c.applyArgs(args);
    return c;
  }

  private void loadDefaults() {
    try (InputStream in = getClass().getClassLoader().getResourceAsStream("application.properties")) {
      if (in != null) p.load(in);
    } catch (Exception e) { throw new RuntimeException(e); }
  }

  private void applyEnv() {
    Map<String,String> e = System.getenv();
    e.forEach((k,v) -> {
      switch (k) {
        case "BOOTSTRAP_SERVERS" -> p.setProperty("bootstrap.servers", v);
        case "TOPIC_AIR" -> p.setProperty("topic.air", v);
        case "TOPIC_NOISE" -> p.setProperty("topic.noise", v);
        case "TOPIC_UNDERGROUND" -> p.setProperty("topic.underground", v);
        case "CSV_AIR" -> p.setProperty("csv.air", v);
        case "CSV_NOISE" -> p.setProperty("csv.noise", v);
        case "CSV_UND" -> p.setProperty("csv.underground", v);
      }
    });
  }

  private void applyArgs(String[] args) {
    if (args == null) return;
    for (String a : args) {
      if (a.startsWith("--")) {
        int i = a.indexOf('=');
        if (i > 2) p.setProperty(a.substring(2, i), a.substring(i+1));
      }
    }
  }

  public String get(String k) { return p.getProperty(k); }
  public int getInt(String k, int def) {
    try { return Integer.parseInt(p.getProperty(k)); } catch (Exception e) { return def; }
  }
}
