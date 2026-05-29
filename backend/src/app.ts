import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { auditContextMiddleware } from "./middleware/auditContext.middleware";
import { errorMiddleware, notFound } from "./middleware/error.middleware";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";
import apiRoutes from "./routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(auditContextMiddleware);
app.use(apiRateLimiter);

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorMiddleware);
