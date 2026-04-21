import { PaymentStatus } from "@prisma/client";
import { Router } from "express";

import { getAuthUser, requireAuth } from "../auth/middleware";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";

const referralsRouter = Router();

referralsRouter.get("/", requireAuth, asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);

  const referred = await prisma.user.findMany({
    where: { referredByUserId: auth.id },
    select: {
      email: true,
      paymentIntents: {
        where: { status: PaymentStatus.PAID },
        select: { amountRub: true }
      }
    }
  });

  const referrals = referred
    .map((user) => ({
      email: user.email,
      totalPaid: user.paymentIntents.reduce((sum, p) => sum + p.amountRub, 0)
    }))
    .filter((r) => r.totalPaid > 0);

  return res.json({ referrals });
}));

export { referralsRouter };
