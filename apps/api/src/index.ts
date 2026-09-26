import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middleware/error.js";
import { healthRouter } from "./routes/health.js";
import { menuRouter } from "./routes/menu.js";
import { restaurantRouter } from "./routes/restaurant.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: webOrigin.split(",").map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ data: { name: "Rubies Cuisine API", version: "0.1.0" } });
});

app.use("/health", healthRouter);
app.use("/menu", menuRouter);
app.use("/restaurant", restaurantRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Rubies API listening on http://localhost:${port}`);
});
