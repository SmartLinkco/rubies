import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let database: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  const ok = database === "up";
  res.status(ok ? 200 : 503).json({
    data: {
      service: "rubies-api",
      status: ok ? "ok" : "degraded",
      database,
      time: new Date().toISOString(),
    },
  });
});
