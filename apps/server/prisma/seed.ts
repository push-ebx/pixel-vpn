import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      code: "basic-30d",
      name: "Базовый на 30 дней",
      description: "Тариф для повседневного использования",
      priceRub: 299,
      durationDays: 30
    },
    {
      code: "pro-90d",
      name: "Профи на 90 дней",
      description: "Выгодный тариф для постоянного использования",
      priceRub: 799,
      durationDays: 90
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: { ...plan, isActive: true },
      update: {
        name: plan.name,
        description: plan.description,
        priceRub: plan.priceRub,
        durationDays: plan.durationDays,
        isActive: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
