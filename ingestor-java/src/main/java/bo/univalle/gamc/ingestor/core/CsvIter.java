package bo.univalle.gamc.ingestor.core;

import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;

import java.io.FileReader;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;

public class CsvIter implements Iterable<String[]>, AutoCloseable {
  private final CSVReader reader;

  public CsvIter(String path) throws Exception {
    var parser = new CSVParserBuilder().withSeparator(',').withIgnoreQuotations(false).build();
    this.reader = new CSVReaderBuilder(new FileReader(path, StandardCharsets.UTF_8))
        .withCSVParser(parser)
        .build();
    // salta header
    reader.readNext();
  }

  @Override public Iterator<String[]> iterator() {
    return new Iterator<>() {
      String[] next;
      @Override public boolean hasNext() {
        try { return (next = reader.readNext()) != null; }
        catch (Exception e) { return false; }
      }
      @Override public String[] next() { return next; }
    };
  }

  @Override public void close() throws Exception { reader.close(); }
}
