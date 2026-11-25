import express from "express";

const app = express();

// Middleware: parse JSON request bodies into req.body
app.use(express.json());

// Health endpoint: lets us (and later, monitoring tools) check the server is alive
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;