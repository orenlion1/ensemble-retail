#!/usr/bin/env node
// Parses the inventory catalog (services/inventory-service/src/main/resources/data.sql)
// into a DynamoDB BatchWriteItem request for the `ensemble-products` table.
//
// data.sql remains the single source of truth for the demo catalog; this script is the
// bridge from the retired Postgres seed to DynamoDB. Output is written to
// infra/seed/products-seed.json (chunked into <=25-item batches per DynamoDB limits).
//
// Usage: node scripts/dynamodb/generate-products-seed.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sqlPath = resolve(root, "services/inventory-service/src/main/resources/data.sql");
const outPath = resolve(root, "infra/seed/products-seed.json");
const TABLE = "ensemble-products";
const COLUMNS = ["id", "name", "department", "category", "original_price", "price",
  "colors", "sizes", "badge", "rating", "stock", "image"];

const sql = readFileSync(sqlPath, "utf8");
const valuesStart = sql.indexOf("VALUES");
if (valuesStart === -1) throw new Error("No VALUES clause found in data.sql");
const body = sql.slice(valuesStart + "VALUES".length);

// Tokenize the VALUES body into tuples, honouring single-quoted strings with '' escapes.
// Each cell records whether it was a quoted string so NULL text and the NULL keyword differ.
function parseTuples(text) {
  const tuples = [];
  let depth = 0, inStr = false, cur = "", curIsStr = false, cells = null;
  const pushCell = () => { cells.push(curIsStr ? { s: cur } : { raw: cur.trim() }); cur = ""; curIsStr = false; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "'") {
        if (text[i + 1] === "'") { cur += "'"; i++; }
        else { inStr = false; }
      } else { cur += c; }
      continue;
    }
    if (c === "'") { inStr = true; curIsStr = true; cur = ""; continue; }
    if (c === "(") { if (depth++ === 0) { cells = []; cur = ""; curIsStr = false; } continue; }
    if (c === ")") { if (--depth === 0) { pushCell(); tuples.push(cells); cells = null; } continue; }
    if (c === "," && depth === 1) { pushCell(); continue; }
    if (depth === 1) cur += c;
  }
  return tuples;
}

function cell(parsed) {
  if (parsed.s !== undefined) return { type: "S", value: parsed.s };
  if (parsed.raw.toUpperCase() === "NULL") return { type: "NULL", value: null };
  return { type: "N", value: parsed.raw };
}

function toItem(cells) {
  if (cells.length !== COLUMNS.length) {
    throw new Error(`Expected ${COLUMNS.length} columns, got ${cells.length}`);
  }
  const row = {};
  COLUMNS.forEach((col, idx) => (row[col] = cell(cells[idx])));
  const item = {
    id: { S: row.id.value },
    name: { S: row.name.value },
    department: { S: row.department.value },
    category: { S: row.category.value },
    price: { N: String(row.price.value) },
    colors: { L: row.colors.value.split(",").map((s) => ({ S: s.trim() })) },
    sizes: { L: row.sizes.value.split(",").map((s) => ({ S: s.trim() })) },
    badge: { S: row.badge.value },
    rating: { N: String(row.rating.value) },
    stock: { N: String(row.stock.value) },
    image: { S: row.image.value },
  };
  if (row.original_price.type === "N") item.originalPrice = { N: String(row.original_price.value) };
  return { PutRequest: { Item: item } };
}

const requests = parseTuples(body).map(toItem);
const batches = [];
for (let i = 0; i < requests.length; i += 25) batches.push(requests.slice(i, i + 25));
const output = batches.map((b) => ({ [TABLE]: b }));

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
console.error(`Wrote ${requests.length} products in ${batches.length} batch(es) to ${outPath}`);
