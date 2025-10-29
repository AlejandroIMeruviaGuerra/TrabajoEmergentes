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
    System.out.println("📂 Leyendo: " + csvPath.getFileName());
    long count = 0;
    
    // ===== CAMBIO: Agregado tracking de tiempo y progreso =====
    // ANTES: Sin feedback de progreso durante la lectura
    // DESPUÉS: 
    //   - Registra tiempo de inicio
    //   - Muestra progreso cada 10,000 registros
    //   - Muestra resumen al final (registros totales + tiempo)
    // RAZÓN: Archivos CSV grandes (670K+ registros) tardan varios minutos,
    //        necesario dar feedback visual del progreso
    long start = System.currentTimeMillis();
    
    try (CSVReader reader = new CSVReader(new FileReader(csvPath.toFile()))) {
      String[] header = reader.readNext();
      if (header == null) return;
      String[] row;
      while ((row = reader.readNext()) != null) {
        Map<String,String> map = mapRow(header, row);
        SensorRecord rec = normalizer.normalize(map);
        if (rec != null) {
          notifyObservers(rec);
          count++;
          
          // ===== CAMBIO: Logging de progreso cada 10K registros =====
          if (count % 10000 == 0) {
            System.out.printf("  📊 Procesados: %,d registros...%n", count);
          }
        }
      }
    }
    
    // ===== CAMBIO: Resumen final con tiempo transcurrido =====
    long elapsed = System.currentTimeMillis() - start;
    System.out.printf("✅ %s: %,d registros en %.2f segundos%n", 
                      csvPath.getFileName(), count, elapsed / 1000.0);
  }

  private Map<String,String> mapRow(String[] h, String[] r){
    Map<String,String> m = new HashMap<>();
    for(int i=0;i<h.length;i++) m.put(h[i], i < r.length ? r[i] : "");
    return m;
  }
}
