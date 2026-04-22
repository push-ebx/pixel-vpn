import { config } from "../config";

const ADMIN_CHAT_ID = "367442531";

export async function notifyNewUserRegistered(input: { email: string; userId: string; referredByEmail?: string | null }) {
  if (!config.TELEGRAM_BOT_ENABLED || !config.TELEGRAM_BOT_TOKEN) {
    return;
  }

  const text = [
    "🆕 Новый пользователь",
    `Email: ${input.email}`,
    `ID: ${input.userId}`,
    input.referredByEmail ? `Реферал: ${input.referredByEmail}` : null
  ].filter(Boolean).join("\n");

  try {
    await fetch(`${config.TELEGRAM_BOT_API_BASE_URL.replace(/\/+$/, "")}/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text
      })
    });
  } catch (error) {
    console.error("Telegram admin notify failed", error);
  }
}
