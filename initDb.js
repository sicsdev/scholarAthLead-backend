const fs = require("fs");
const path = require("path");
const db = require("./config/db");

const schemaPath = path.join(__dirname, "schemas", "availabilitySchema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

db.query(schema, (err, results) => {
  if (err) throw err;

  console.log("Schema initialized");
  db.end();
});
