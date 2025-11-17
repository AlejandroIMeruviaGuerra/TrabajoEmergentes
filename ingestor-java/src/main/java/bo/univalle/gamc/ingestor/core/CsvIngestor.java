package bo.univalle.gamc.ingestor.core;

import bo.univalle.gamc.ingestor.normalize.Normalizer;
import com.opencsv.CSVReader;

import java.io.FileReader;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;

public class CsvIngestor implements Subject {

    private final Path csvPath;
    private final Normalizer normalizer;
    private final List<Observer> observers = new ArrayList<>();

    public CsvIngestor(Path csvPath, Normalizer normalizer) {
        this.csvPath = csvPath;
        this.normalizer = normalizer;
    }

    @Override
    public void addObserver(Observer o) {
        observers.add(o);
    }

    @Override
    public void removeObserver(Observer o) {
        observers.remove(o);
    }

    @Override
    public void notifyObservers(SensorRecord r) {
        for (Observer o : observers) {
            o.update(r);
        }
    }

    public void run() throws Exception {

        System.out.println("📂 Leyendo CSV: " + csvPath.toAbsolutePath());

        long count = 0;
        long start = System.currentTimeMillis();

        try (CSVReader reader = new CSVReader(new FileReader(csvPath.toFile()))) {

            String[] header = reader.readNext();
            if (header == null) {
                System.out.println("❌ CSV vacío.");
                return;
            }

            String[] row;

            while ((row = reader.readNext()) != null) {

                Map<String, String> map = mapRow(header, row);

                SensorRecord rec = normalizer.normalize(map);

                if (rec != null) {
                    notifyObservers(rec);
                    count++;

                    if (count % 10000 == 0) {
                        System.out.printf("  📊 Procesados: %,d registros…%n", count);
                    }
                }
            }
        }

        long elapsed = System.currentTimeMillis() - start;
        System.out.printf(
                "✅ %s: %,d registros procesados en %.2f segundos%n",
                csvPath.getFileName(),
                count,
                elapsed / 1000.0
        );
    }

    private Map<String, String> mapRow(String[] header, String[] row) {
        Map<String, String> map = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            map.put(header[i], i < row.length ? row[i] : "");
        }
        return map;
    }
}
