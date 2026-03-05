require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const routes = require("./routes/index");
const authRoutes = require("./routes/auth");
const aiRoutes = require("./routes/ai");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection (optional, will not block if unavailable)
const mongoUri = "mongodb+srv://admin_pfe:50611477@cluster0.ooyzlhe.mongodb.net/gestion_projets?retryWrites=true&w=majority";
mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected to gestion_projets"))
  .catch((err) => console.warn("MongoDB not connected (AI routes still active):", err.message));

// Routes
app.use("/api", routes);
app.use("/api", authRoutes);
app.use("/api", aiRoutes);

// Health check
app.get("/", (req, res) => res.json({ status: "OSS Backend running" }));

// Start server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
