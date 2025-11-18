#!/usr/bin/env node
/**
 * Script para testear cómo el CSV está siendo parseado
 */

import fs from "fs";

// Leer el CSV simple
const csv = fs.readFileSync("D:/lunes/TrabajoEmergentes/test-simple.csv", "utf-8");
console.log("📋 CSV content:");
console.log(csv);

// Parsear con líneas
const lines = csv.trim().split("\n");
const headers = lines[0].split(",");
const row = lines[1].split(",");

console.log("\n📊 Headers:");
headers.forEach((h, i) => console.log(`  [${i}] "${h}"`));

console.log("\n📊 First row:");
row.forEach((v, i) => console.log(`  [${i}] "${v}"`));

console.log("\n📊 Map:");
const map = {};
for (let i = 0; i < headers.length; i++) {
  map[headers[i]] = row[i] || "";
}
Object.entries(map).forEach(([k, v]) => console.log(`  ${k} = "${v}"`));
