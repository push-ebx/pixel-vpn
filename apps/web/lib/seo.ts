export const SITE_NAME = "Pixel VPN";
export const SITE_DESCRIPTION = "Быстрый и безопасный VPN сервис. Подключение через Нидерланды, защита трафика и стабильный доступ.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pixel-vpn.ru";
export const SITE_LOCALE = "ru_RU";

export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL.replace(/\/$/, "")}${normalizedPath}`;
}
