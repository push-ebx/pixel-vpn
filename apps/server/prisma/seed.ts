import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      code: "day-1",
      name: "1 день",
      description: "Тестовый короткий тариф",
      landingSlug: "pixel-vpn",
      order: 5,
      priceRub: 10,
      durationDays: 1
    },
    {
      code: "basic-30d",
      name: "30 дней",
      description: "Базовый тариф для повседневного использования",
      landingSlug: "pixel-vpn",
      order: 10,
      priceRub: 99,
      durationDays: 30
    },
    {
      code: "pro-90d",
      name: "3 месяца",
      description: "Выгодный тариф для постоянного использования",
      landingSlug: "pixel-vpn",
      order: 20,
      priceRub: 249,
      durationDays: 90
    },
    {
      code: "semiannual-180d",
      name: "6 месяцев",
      description: "Расширенный тариф с лучшей ценой за месяц",
      landingSlug: "pixel-vpn",
      order: 30,
      priceRub: 499,
      durationDays: 180
    },
    {
      code: "annual-365d",
      name: "12 месяцев",
      description: "Максимально выгодный тариф на год",
      landingSlug: "pixel-vpn",
      order: 40,
      priceRub: 899,
      durationDays: 365
    },
    {
      code: "nova-basic-30d",
      name: "Базовый",
      description: "Для личного использования",
      landingSlug: "nova-vpn",
      order: 10,
      priceRub: 199,
      durationDays: 30
    },
    {
      code: "nova-premium-30d",
      name: "Премиум",
      description: "Для активных пользователей",
      landingSlug: "nova-vpn",
      order: 20,
      priceRub: 299,
      durationDays: 30
    },
    {
      code: "nova-family-30d",
      name: "Семейный",
      description: "Для всей семьи",
      landingSlug: "nova-vpn",
      order: 30,
      priceRub: 499,
      durationDays: 30
    },
    {
      code: "flash-starter-30d",
      name: "STARTER",
      description: "Базовый доступ Flash VPN",
      landingSlug: "flash-vpn",
      order: 10,
      priceRub: 149,
      durationDays: 30
    },
    {
      code: "flash-30d",
      name: "FLASH",
      description: "Максимальная скорость и приоритетная поддержка",
      landingSlug: "flash-vpn",
      order: 20,
      priceRub: 249,
      durationDays: 30
    },
    {
      code: "flash-ultra-30d",
      name: "ULTRA",
      description: "Расширенный тариф Flash VPN",
      landingSlug: "flash-vpn",
      order: 30,
      priceRub: 399,
      durationDays: 30
    },
    {
      code: "nodino-basic-30d",
      name: "Базовый",
      description: "Для личного использования",
      landingSlug: "nodino-vpn",
      order: 10,
      priceRub: 149,
      durationDays: 30
    },
    {
      code: "nodino-pro-30d",
      name: "Про",
      description: "Для активных пользователей",
      landingSlug: "nodino-vpn",
      order: 20,
      priceRub: 249,
      durationDays: 30
    },
    {
      code: "nodino-max-30d",
      name: "Максимум",
      description: "Для семьи и бизнеса",
      landingSlug: "nodino-vpn",
      order: 30,
      priceRub: 399,
      durationDays: 30
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: { ...plan, isActive: true },
      update: {
        name: plan.name,
        description: plan.description,
        landingSlug: plan.landingSlug,
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
