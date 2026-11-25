import app from "./app.js";
import { redis } from "./config/redis.js"

const PORT = process.env.PORT || 4000;

redis.connect().catch((error) => {
  console.error("Redis: initial connection failed",error.message);
})

app.listen(PORT, () => {
  console.log(`IdentityHub listening on port ${PORT}`);
});