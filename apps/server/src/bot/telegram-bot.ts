import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { Markup, Telegraf } from "telegraf";
import type { Context } from "telegraf";

import { config } from "../config";
import { prisma } from "../lib/prisma";
import { markPaymentIntentPaid, syncPendingPaymentsForUser } from "../payments/service";
import { createYooKassaPayment, hasYooKassaCredentials } from "../payments/yookassa";
import { buildVlessLink } from "../vpn/vless";

type InlineKeyboard = ReturnType<typeof Markup.inlineKeyboard>;

const CALLBACK = {
  TARIFFS: "menu:tariffs",
  PLAN: "plan:",
  MY_TARIFF: "menu:my-tariff",
  STATUS: "menu:status",
  KEY: "menu:key",
  INSTRUCTION: "menu:instruction",
  PLATFORM: "platform:",
  BACK: "menu:back"
} as const;

const PLATFORM_LINKS = {
  android: "https://play.google.com/store/apps/details?id=app.hiddify.com",
  ios: "https://apps.apple.com/us/app/hiddify-proxy-vpn/id6596777532",
  windows: "https://github.com/hiddify/hiddify-app/releases",
  macos: "https://github.com/hiddify/hiddify-app/releases"
} as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildTelegramEmail(chatId: number) {
  return `tg_${chatId}@telegram.pixel-vpn.local`;
}

function formatRemainingTime(remainingMs: number) {
  const totalMinutes = Math.max(0, Math.floor(remainingMs / 60_000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} д ${hours} ч ${minutes} мин`;
  }

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }

  return `${minutes} мин`;
}

function extractErrorText(error: unknown) {
  const pieces: string[] = [];

  if (error && typeof error === "object") {
    if ("name" in error && typeof error.name === "string") {
      pieces.push(error.name);
    }
    if ("message" in error && typeof error.message === "string") {
      pieces.push(error.message);
    }
    if ("code" in error && typeof error.code === "string") {
      pieces.push(error.code);
    }

    if ("cause" in error && error.cause && typeof error.cause === "object") {
      const cause = error.cause as { message?: unknown; code?: unknown; name?: unknown };
      if (typeof cause.name === "string") {
        pieces.push(cause.name);
      }
      if (typeof cause.message === "string") {
        pieces.push(cause.message);
      }
      if (typeof cause.code === "string") {
        pieces.push(cause.code);
      }
    }
  } else {
    pieces.push(String(error));
  }

  return pieces.join(" ").toLowerCase();
}

function isConnectivityError(error: unknown) {
  const text = extractErrorText(error);

  return (
    text.includes("connect timeout") ||
    text.includes("und_err_connect_timeout") ||
    text.includes("fetch failed") ||
    text.includes("etimedout") ||
    text.includes("econnrefused") ||
    text.includes("enetunreach") ||
    text.includes("ehostunreach") ||
    text.includes("eai_again")
  );
}

function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("Тарифы", CALLBACK.TARIFFS),
      Markup.button.callback("Мой тариф", CALLBACK.MY_TARIFF)
    ],
    [
      Markup.button.callback("Мой ключ", CALLBACK.KEY),
      Markup.button.callback("Инструкция", CALLBACK.INSTRUCTION)
    ]
  ]);
}

function instructionKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("Android", `${CALLBACK.PLATFORM}android`),
      Markup.button.callback("iOS", `${CALLBACK.PLATFORM}ios`)
    ],
    [
      Markup.button.callback("Windows", `${CALLBACK.PLATFORM}windows`),
      Markup.button.callback("macOS", `${CALLBACK.PLATFORM}macos`)
    ],
    [Markup.button.callback("В меню", CALLBACK.BACK)]
  ]);
}

function instructionDetailsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Назад", CALLBACK.INSTRUCTION)],
    [Markup.button.callback("В меню", CALLBACK.BACK)]
  ]);
}

function statusKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("Мой ключ", CALLBACK.KEY),
      Markup.button.callback("Тарифы", CALLBACK.TARIFFS)
    ],
    [Markup.button.callback("В меню", CALLBACK.BACK)]
  ]);
}

class TelegramBotService {
  private readonly bot: Telegraf<Context>;

  private running = false;

  private launched = false;

  private pollRetryDelayMs = 1500;

  private lastConnectivityHintAt = 0;

  constructor(token: string, apiBaseUrl: string) {
    this.bot = new Telegraf(token, {
      telegram: {
        apiRoot: apiBaseUrl.replace(/\/+$/, "")
      },
      handlerTimeout: config.TELEGRAM_BOT_REQUEST_TIMEOUT_MS
    });

    this.bot.catch(async (error, ctx) => {
      // eslint-disable-next-line no-console
      console.error("Telegram update handler error", {
        updateId: ctx.update.update_id,
        error
      });
    });

    this.registerHandlers();
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    void this.launchLoop();
  }

  stop() {
    this.running = false;
    if (!this.launched) {
      return;
    }

    try {
      this.bot.stop("shutdown");
    } catch {
      // ignore stop race
    } finally {
      this.launched = false;
    }
  }

  private async launchLoop() {
    // eslint-disable-next-line no-console
    console.log("Telegram bot polling started (telegraf)");

    while (this.running) {
      try {
        await this.bot.launch(
          {
            dropPendingUpdates: false,
            allowedUpdates: ["message", "callback_query"]
          },
          () => {
            this.launched = true;
            this.pollRetryDelayMs = 1500;
            // eslint-disable-next-line no-console
            console.log("Telegram bot connected");
          }
        );
        this.launched = false;
      } catch (error) {
        this.launched = false;

        const now = Date.now();
        if (isConnectivityError(error) && now - this.lastConnectivityHintAt > 60_000) {
          this.lastConnectivityHintAt = now;
          // eslint-disable-next-line no-console
          console.error(
            "Telegram connectivity issue. Check outbound access to api.telegram.org:443 or set TELEGRAM_BOT_API_BASE_URL to a reachable endpoint."
          );
        }

        // eslint-disable-next-line no-console
        console.error("Telegram polling error", error);
      }

      if (!this.running) {
        break;
      }

      await sleep(this.pollRetryDelayMs);
      this.pollRetryDelayMs = Math.min(this.pollRetryDelayMs * 2, 30_000);
    }

    // eslint-disable-next-line no-console
    console.log("Telegram bot polling stopped");
  }

  private registerHandlers() {
    this.bot.start(async (ctx) => {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        return;
      }

      await this.sendWelcome(chatId);
    });

    this.bot.help(async (ctx) => {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        return;
      }

      await this.sendWelcome(chatId);
    });

    this.bot.on("text", async (ctx) => {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        return;
      }

      const text = ctx.message.text.trim();
      if (text === "/start" || text === "/help") {
        return;
      }

      await this.sendMessage(chatId, "Используйте /start и кнопки меню.", mainMenuKeyboard());
    });

    this.bot.on("callback_query", async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch {
        // ignore callback answer race
      }

      const chatId = ctx.chat?.id;
      if (!chatId) {
        return;
      }

      const query = ctx.callbackQuery;
      if (!("data" in query) || typeof query.data !== "string") {
        return;
      }

      await this.handleCallback(chatId, query.data);
    });
  }

  private async sendMessage(chatId: number, text: string, keyboard?: InlineKeyboard) {
    if (keyboard) {
      await this.bot.telegram.sendMessage(chatId, text, keyboard);
      return;
    }

    await this.bot.telegram.sendMessage(chatId, text);
  }

  private async getOrCreateUserByTelegramId(chatId: number) {
    const email = buildTelegramEmail(chatId);

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (existing) {
      return existing;
    }

    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    return prisma.user.create({
      data: {
        email,
        passwordHash
      },
      select: { id: true, email: true }
    });
  }

  private async handleCallback(chatId: number, data: string) {
    if (data === CALLBACK.BACK) {
      await this.sendMessage(chatId, "Главное меню:", mainMenuKeyboard());
      return;
    }

    if (data === CALLBACK.INSTRUCTION) {
      await this.sendMessage(chatId, "Выберите платформу:", instructionKeyboard());
      return;
    }

    if (data.startsWith(CALLBACK.PLATFORM)) {
      const platform = data.slice(CALLBACK.PLATFORM.length);
      await this.sendPlatformInstructions(chatId, platform);
      return;
    }

    const user = await this.getOrCreateUserByTelegramId(chatId);

    if (data === CALLBACK.TARIFFS) {
      await this.sendPlans(chatId);
      return;
    }

    if (data.startsWith(CALLBACK.PLAN)) {
      const planId = data.slice(CALLBACK.PLAN.length);
      await this.createPaymentForPlan(chatId, user.id, planId);
      return;
    }

    if (data === CALLBACK.MY_TARIFF) {
      await this.sendTariff(chatId, user.id);
      return;
    }

    if (data === CALLBACK.STATUS) {
      await this.sendStatus(chatId, user.id);
      return;
    }

    if (data === CALLBACK.KEY) {
      await this.sendVlessKey(chatId, user.id);
    }
  }

  private async sendWelcome(chatId: number) {
    await this.getOrCreateUserByTelegramId(chatId);

    await this.sendMessage(
      chatId,
      [
        "Pixel VPN",
        "",
        "Быстрый и стабильный VPN для работы, учебы и путешествий.",
        "В боте можно выбрать тариф, оплатить подписку, получить ключ и открыть инструкцию для вашей платформы."
      ].join("\n"),
      mainMenuKeyboard()
    );
  }

  private async sendPlans(chatId: number) {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { priceRub: "asc" }, { durationDays: "asc" }]
    });

    if (plans.length === 0) {
      await this.sendMessage(chatId, "Сейчас нет доступных тарифов.");
      return;
    }

    const rows = plans.map((plan) => [
      Markup.button.callback(`${plan.name} (${plan.priceRub} RUB)`, `${CALLBACK.PLAN}${plan.id}`)
    ]);
    rows.push([Markup.button.callback("В меню", CALLBACK.BACK)]);

    await this.sendMessage(chatId, "Доступные тарифы:", Markup.inlineKeyboard(rows));
  }

  private async createPaymentForPlan(chatId: number, userId: string, planId: string) {
    const plan = await prisma.plan.findFirst({
      where: {
        id: planId,
        isActive: true
      }
    });

    if (!plan) {
      await this.sendMessage(chatId, "Тариф не найден.");
      return;
    }

    const expiresAt = new Date(Date.now() + config.PAYMENT_INTENT_TTL_MINUTES * 60_000);

    if (plan.priceRub <= 0) {
      const freeIntent = await prisma.paymentIntent.create({
        data: {
          userId,
          planId: plan.id,
          amountRub: 0,
          provider: "free",
          status: PaymentStatus.PENDING,
          expiresAt
        }
      });

      const paidIntent = await markPaymentIntentPaid(freeIntent.id, userId);
      await this.sendMessage(
        chatId,
        `Тариф активирован: ${paidIntent.plan.name} (${paidIntent.plan.durationDays} дней).`,
        statusKeyboard()
      );
      return;
    }

    if (!hasYooKassaCredentials()) {
      await this.sendMessage(chatId, "Оплата недоступна: YooKassa не настроена на сервере.", statusKeyboard());
      return;
    }

    const intent = await prisma.paymentIntent.create({
      data: {
        userId,
        planId: plan.id,
        amountRub: plan.priceRub,
        provider: "yookassa",
        status: PaymentStatus.PENDING,
        expiresAt
      }
    });

    try {
      const yookassaPayment = await createYooKassaPayment({
        paymentIntentId: intent.id,
        userId,
        amountRub: intent.amountRub,
        description: `Pixel VPN ${plan.name}`
      });

      const updatedIntent = await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          externalId: yookassaPayment.externalId,
          sbpDeepLink: yookassaPayment.confirmationUrl
        }
      });

      if (updatedIntent.sbpDeepLink) {
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.url("Оплатить", updatedIntent.sbpDeepLink)],
          [Markup.button.callback("Проверить статус", CALLBACK.STATUS)],
          [Markup.button.callback("В меню", CALLBACK.BACK)]
        ]);

        await this.sendMessage(
          chatId,
          `Счет создан.\nТариф: ${plan.name}\nСумма: ${plan.priceRub} RUB\n\nНажмите «Оплатить», после оплаты нажмите «Проверить статус».`,
          keyboard
        );
        return;
      }

      await this.sendMessage(
        chatId,
        "Счет создан, но ссылка на оплату еще не готова. Попробуйте снова через 10 секунд.",
        statusKeyboard()
      );
    } catch (error) {
      await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: PaymentStatus.FAILED }
      });

      const message = error instanceof Error ? error.message : "Не удалось создать платеж";
      await this.sendMessage(chatId, `Ошибка оплаты: ${message}`, statusKeyboard());
    }
  }

  private async getSubscriptionSummary(userId: string) {
    const now = new Date();
    await syncPendingPaymentsForUser(userId);

    let subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    });

    if (!subscription) {
      return null;
    }

    if (subscription.status === SubscriptionStatus.ACTIVE && subscription.endsAt <= now) {
      subscription = await prisma.subscription.update({
        where: { userId },
        data: { status: SubscriptionStatus.EXPIRED },
        include: { plan: true }
      });
    }

    const active = subscription.status === SubscriptionStatus.ACTIVE && subscription.endsAt > now;
    const remainingMs = Math.max(0, subscription.endsAt.getTime() - now.getTime());

    return {
      active,
      remainingMs,
      endsAt: subscription.endsAt,
      status: subscription.status,
      plan: subscription.plan
    };
  }

  private async sendTariff(chatId: number, userId: string) {
    const summary = await this.getSubscriptionSummary(userId);
    if (!summary) {
      await this.sendMessage(chatId, "У вас пока нет подписки.", statusKeyboard());
      return;
    }

    const statusText = summary.active ? "активна" : `неактивна (${summary.status})`;
    const remainingText = summary.active ? formatRemainingTime(summary.remainingMs) : "0 мин";

    await this.sendMessage(
      chatId,
      [
        `Тариф: ${summary.plan.name}`,
        `Срок: ${summary.plan.durationDays} дней`,
        `Цена: ${summary.plan.priceRub} RUB`,
        `Статус: ${statusText}`,
        `Осталось: ${remainingText}`,
        `До: ${summary.endsAt.toLocaleString("ru-RU")}`
      ].join("\n"),
      statusKeyboard()
    );
  }

  private async sendStatus(chatId: number, userId: string) {
    const summary = await this.getSubscriptionSummary(userId);
    if (!summary) {
      await this.sendMessage(chatId, "Статус: неактивно (подписка не найдена).", statusKeyboard());
      return;
    }

    if (!summary.active) {
      await this.sendMessage(chatId, `Статус: неактивно (${summary.status}).`, statusKeyboard());
      return;
    }

    await this.sendMessage(chatId, `Статус: активна\nДо: ${summary.endsAt.toLocaleString("ru-RU")}`, statusKeyboard());
  }

  private async sendVlessKey(chatId: number, userId: string) {
    const summary = await this.getSubscriptionSummary(userId);
    if (!summary?.active) {
      await this.sendMessage(chatId, "Ключ доступен только при активной подписке.", statusKeyboard());
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        vpnUuid: true
      }
    });

    if (!user?.vpnUuid) {
      await this.sendMessage(chatId, "Ключ еще не сгенерирован. Напишите в поддержку.", statusKeyboard());
      return;
    }

    const link = buildVlessLink({ uuid: user.vpnUuid, label: "PixelVPN" });
    await this.sendMessage(chatId, `Ваш VLESS ключ:`);
    await this.sendMessage(chatId, `${link}`, statusKeyboard());
  }

  private async sendPlatformInstructions(chatId: number, platform: string) {
    if (platform === "android") {
      await this.sendMessage(
        chatId,
        [
          "Android:",
          "1) Установите Hiddify из Google Play.",
          "2) В приложении нажмите + и добавьте ключ из буфера или QR.",
          "3) Возьмите ключ в разделе «Мой ключ» и подключитесь.",
          `Скачать: ${PLATFORM_LINKS.android}`
        ].join("\n"),
        instructionDetailsKeyboard()
      );
      return;
    }

    if (platform === "ios") {
      await this.sendMessage(
        chatId,
        [
          "iOS:",
          "1) Установите Hiddify из App Store.",
          "2) Нажмите + и импортируйте ключ из буфера/QR.",
          "3) Возьмите ключ в разделе «Мой ключ» и подключитесь.",
          `Скачать: ${PLATFORM_LINKS.ios}`
        ].join("\n"),
        instructionDetailsKeyboard()
      );
      return;
    }

    if (platform === "windows") {
      await this.sendMessage(
        chatId,
        [
          "Windows:",
          "1) Скачайте Hiddify Desktop.",
          "2) Нажмите + и добавьте VLESS ключ из буфера.",
          "3) Выберите профиль и нажмите «Подключиться».",
          `Скачать: ${PLATFORM_LINKS.windows}`
        ].join("\n"),
        instructionDetailsKeyboard()
      );
      return;
    }

    if (platform === "macos") {
      await this.sendMessage(
        chatId,
        [
          "macOS:",
          "1) Скачайте Hiddify Desktop.",
          "2) Нажмите + и добавьте VLESS ключ из буфера.",
          "3) Выберите профиль и нажмите «Подключиться».",
          `Скачать: ${PLATFORM_LINKS.macos}`
        ].join("\n"),
        instructionDetailsKeyboard()
      );
      return;
    }

    await this.sendMessage(chatId, "Платформа не поддерживается.", instructionDetailsKeyboard());
  }
}

export function createTelegramBotService() {
  if (!config.TELEGRAM_BOT_ENABLED) {
    return null;
  }

  const token = config.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_ENABLED=true, but TELEGRAM_BOT_TOKEN is missing");
  }

  return new TelegramBotService(token, config.TELEGRAM_BOT_API_BASE_URL);
}
