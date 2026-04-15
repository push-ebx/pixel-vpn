import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "pixel-vpn-api",
    time: new Date().toISOString()
  });
});

export { healthRouter };
