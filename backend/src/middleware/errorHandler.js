export function errorHandler(error, req, res, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Unhandled error:", error.message);
  return res.status(500).json({ error: "Internal server error" });
}