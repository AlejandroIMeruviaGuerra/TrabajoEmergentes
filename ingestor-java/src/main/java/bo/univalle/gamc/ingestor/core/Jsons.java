package bo.univalle.gamc.ingestor.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class Jsons {
  private static final ObjectMapper OM = new ObjectMapper();
  public static ObjectNode obj() { return OM.createObjectNode(); }
  public static ArrayNode arr() { return OM.createArrayNode(); }
  public static ObjectMapper mapper() { return OM; }
}
