-- Crear base de datos
CREATE DATABASE IF NOT EXISTS emergentes;
USE emergentes;

-- Tablas de agregación
CREATE TABLE IF NOT EXISTS air_quality_agg_1m (
  devEui VARCHAR(64),
  ts_window DATETIME,
  location_name VARCHAR(128),
  co2_avg FLOAT, 
  temperature_avg FLOAT, 
  humidity_avg FLOAT, 
  pressure_avg FLOAT,
  count INT,
  PRIMARY KEY (devEui, ts_window)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS noise_agg_1m (
  devEui VARCHAR(64),
  ts_window DATETIME,
  location_name VARCHAR(128),
  laeq_avg FLOAT, 
  lai_avg FLOAT, 
  laimax_avg FLOAT,
  count INT,
  PRIMARY KEY (devEui, ts_window)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS underground_agg_1m (
  devEui VARCHAR(64),
  ts_window DATETIME,
  location_name VARCHAR(128),
  distance_avg FLOAT,
  count INT,
  PRIMARY KEY (devEui, ts_window)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tablas de datos crudos
CREATE TABLE IF NOT EXISTS air_quality (
  id VARCHAR(64) PRIMARY KEY,
  time DATETIME,
  devEui VARCHAR(64),
  device_name VARCHAR(128),
  device_profile VARCHAR(128),
  tenant VARCHAR(128),
  application VARCHAR(128),
  address VARCHAR(255),
  lat DOUBLE, 
  lng DOUBLE,
  sf INT, 
  bw INT, 
  dr INT,
  co2 DOUBLE, 
  temperature DOUBLE, 
  humidity DOUBLE, 
  pressure DOUBLE,
  co2_status VARCHAR(64), 
  co2_message VARCHAR(255),
  temperature_message VARCHAR(255), 
  humidity_message VARCHAR(255), 
  pressure_status VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_devEui (devEui),
  INDEX idx_time (time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS noise (
  id VARCHAR(64) PRIMARY KEY,
  time DATETIME,
  devEui VARCHAR(64),
  device_name VARCHAR(128),
  device_profile VARCHAR(128),
  address VARCHAR(255),
  lat DOUBLE, 
  lng DOUBLE,
  sf INT, 
  bw INT, 
  dr INT,
  laeq DOUBLE, 
  lai DOUBLE, 
  laimax DOUBLE,
  laeq_status VARCHAR(64), 
  laeq_message VARCHAR(255),
  lai_message VARCHAR(255), 
  laimax_message VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_devEui (devEui),
  INDEX idx_time (time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS underground (
  id VARCHAR(64) PRIMARY KEY,
  time DATETIME,
  devEui VARCHAR(64),
  device_name VARCHAR(128),
  device_profile VARCHAR(128),
  address VARCHAR(255),
  lat DOUBLE, 
  lng DOUBLE,
  sf INT, 
  bw INT, 
  dr INT,
  distance DOUBLE,
  distance_status VARCHAR(64), 
  distance_message VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_devEui (devEui),
  INDEX idx_time (time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
