import express from "express";
import { prisma } from "./config/prisma.js";
import { redis } from "./config/redis.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js"
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);


async function checkDatabase() {
  try{
    await prisma.$queryRaw`SELECT 1`;
    return "up";
  } catch (error) {
    console.error("Healthcheck: dtatabase unreachable",error.message);
    return "down";
  }
}

async function checkRedis () {
  try {
    if(!redis.isReady) return "down";
    await redis.ping();
    return "up";
  } catch (error) {
    console.error("Health check:  Redis is unreachable " , error.message);
    return "down";
  }
}

app.get("/health", async (req, res) => {
 const [database, redisStatus] =await Promise.all ([
  checkDatabase(),
  checkRedis(),
 ]);

 const healthy = database === "up" && redisStatus ==="up";

 res.status(healthy ? 200 : 503).json({
  status: healthy? "ok" : "degraded",
  database,
  redis: redisStatus,
 });
});

app.use(errorHandler);

export default app;