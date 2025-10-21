const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());

app.get("/api/locations", async (req, res) => {
  try {
    const result = await db.query("SELECT id, region, address, postcode, latitude, longitude FROM location");
    res.json(result.rows);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Server error");
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`API listening at http://localhost:${PORT}`));