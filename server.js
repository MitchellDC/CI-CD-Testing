const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "demo",
});

// Wait for DB to be ready
async function waitForDb() {
  while (true) {
    try {
      await pool.query("SELECT 1");
      console.log("Connected to database");
      break;
    } catch {
      console.log("Waiting for database...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Initialize table
async function init() {
  await waitForDb();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);
}
init();

// Routes
app.get("/api/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users ORDER BY id");
  res.json(result.rows);
});

app.post("/api/users", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.sendStatus(400);

  try {
    await pool.query("INSERT INTO users (name) VALUES ($1)", [name]);
    const result = await pool.query("SELECT * FROM users ORDER BY id");
    res.json(result.rows); // Return updated list
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
