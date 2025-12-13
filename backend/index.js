import express from "express";
import cors from "cors";
import uploadRoute from "../src/lib/upload.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", uploadRoute);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

const PORT = process.env.PORT || 5173; 

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

