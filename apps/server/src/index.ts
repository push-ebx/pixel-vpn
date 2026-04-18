import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { config, getAllowedOrigins } from "./config";
import { prisma } from "./lib/prisma";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { healthRouter } from "./routes/health";
import { paymentsRouter } from "./routes/payments";
import { plansRouter } from "./routes/plans";
import { promoCodesRouter } from "./routes/promocodes";
import { subscriptionRouter } from "./routes/subscription";

const app = express();

const allowedOrigins = getAllowedOrigins();
const corsOriginMatcher =
  allowedOrigins === "*"
    ? true
    : (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const isTauriOrigin =
          origin === "tauri://localhost" ||
          origin === "http://tauri.localhost" ||
          origin.endsWith(".tauri.localhost");
        const isAllowedConfigOrigin = Array.isArray(allowedOrigins) && allowedOrigins.includes(origin);

        if (isTauriOrigin || isAllowedConfigOrigin) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin is not allowed by CORS: ${origin}`));
      };

app.use(
  cors({
    origin: corsOriginMatcher,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "pixel-vpn-api" });
});

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/plans", plansRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/promocodes", promoCodesRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/admin", adminRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

const server = app.listen(config.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${config.PORT}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
