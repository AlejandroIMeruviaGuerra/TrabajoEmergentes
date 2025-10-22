package bo.univalle.gamc.ingestor.core;

import bo.univalle.gamc.ingestor.normalize.Normalizer;
import com.opencsv.CSVReader;
import java.io.FileReader;
import java.nio.file.Path;
import java.util.*;

public class CsvIngestor implements Subject {
  private final List<Observer> observers = new ArrayList<>();
  private final Path csvPath;
  private final Normalizer normalizer;

  public CsvIngestor(Path csvPath, Normalizer normalizer) {
    this.csvPath = csvPath;
    this.normalizer = normalizer;
  }

  @Override public void addObserver(Observer o){ observers.add(o); }
  @Override public void removeObserver(Observer o){ observers.remove(o); }
  @Override public void notifyObservers(SensorRecord r){ observers.forEach(o -> o.update(r)); }

  public void run() throws Exception {
    try (CSVReader reader = new CSVReader(new FileReader(csvPath.toFile()))) {
      String[] header = reader.readNext();
      if (header == null) return;
      String[] row;
      while ((row = reader.readNext()) != null) {
        Map<String,String> map = mapRow(header, row);
        SensorRecord rec = normalizer.normalize(map);
        if (rec != null) notifyObservers(rec);
      }
    }
  }

  private Map<String,String> mapRow(String[] h, String[] r){
    Map<String,String> m = new HashMap<>();
    for(int i=0;i<h.length;i++) m.put(h[i], i < r.length ? r[i] : "");
    return m;
  }
}
