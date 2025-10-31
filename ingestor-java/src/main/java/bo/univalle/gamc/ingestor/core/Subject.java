package bo.univalle.gamc.ingestor.core;
public interface Subject {
  void addObserver(Observer o);
  void removeObserver(Observer o);
  void notifyObservers(SensorRecord record);
}
