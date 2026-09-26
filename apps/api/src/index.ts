import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middleware/error.js";
import { attachSession } from "./middleware/session.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { cartRouter } from "./routes/cart.js";
import { cateringRouter } from "./routes/catering.js";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { menuRouter } from "./routes/menu.js";
import { offersRouter } from "./routes/offers.js";
import { ordersRouter } from "./routes/orders.js";
import {
  paymentsRouter,
  paystackWebhookHandler,
} from "./routes/payments.js";
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

app.post(
  "/payments/paystack/webhook",
  express.raw({ type: "application/json" }),
  paystackWebhookHandler,
);

app.use(express.json());
app.use(cookieParser());
app.use(attachSession);

app.get("/", (_req, res) => {
  res.json({ data: { name: "Rubies Cuisine API", version: "0.5.0" } });
});

app.use("/health", healthRouter);
app.use("/menu", menuRouter);
app.use("/restaurant", restaurantRouter);
app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/cart", cartRouter);
app.use("/orders", ordersRouter);
app.use("/offers", offersRouter);
app.use("/catering", cateringRouter);
app.use("/payments", paymentsRouter);
app.use("/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Rubies API listening on http://localhost:${port}`);
});
