import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      code: "day-1",
      name: "1 день",
      description: "Тестовый короткий тариф",
      order: 5,
      priceRub: 10,
      durationDays: 1
    },
    {
      code: "basic-30d",
      name: "30 дней",
      description: "Базовый тариф для повседневного использования",
      order: 10,
      priceRub: 99,
      durationDays: 30
    },
    {
      code: "pro-90d",
      name: "3 месяца",
      description: "Выгодный тариф для постоянного использования",
      order: 20,
      priceRub: 249,
      durationDays: 90
    },
    {
      code: "semiannual-180d",
      name: "6 месяцев",
      description: "Расширенный тариф с лучшей ценой за месяц",
      order: 30,
      priceRub: 499,
      durationDays: 180
    },
    {
      code: "annual-365d",
      name: "12 месяцев",
      description: "Максимально выгодный тариф на год",
      order: 40,
      priceRub: 899,
      durationDays: 365
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: { ...plan, isActive: true },
      update: {
        name: plan.name,
        description: plan.description,
        order: plan.order,
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
