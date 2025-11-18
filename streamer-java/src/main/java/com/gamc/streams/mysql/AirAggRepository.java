package com.gamc.streams.mysql;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

public class AirAggRepository {

    private final String jdbcUrl;
    private final String user;
    private final String pass;

    public AirAggRepository(String host, String db, String user, String pass) {
        this.jdbcUrl = "jdbc:mysql://" + host + "/" + db
                + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        this.user = user;
        this.pass = pass;
    }

    private Connection connect() throws Exception {
        return DriverManager.getConnection(jdbcUrl, user, pass);
    }

    public void saveAirAgg(
            String devEui,
            String tsWindow,
            double co2Avg,
            double tempAvg,
            double humAvg,
            double pressureAvg,
            long count
    ) throws Exception {

        String sql = """
                REPLACE INTO air_quality_agg_1m
                (devEui, ts_window, co2_avg, temperature_avg, humidity_avg, pressure_avg, count)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection con = connect(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, devEui);
            ps.setString(2, tsWindow);
            ps.setDouble(3, co2Avg);
            ps.setDouble(4, tempAvg);
            ps.setDouble(5, humAvg);
            ps.setDouble(6, pressureAvg);
            ps.setLong(7, count);
            ps.executeUpdate();
        }
    }
}
