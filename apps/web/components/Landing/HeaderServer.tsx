import Link from "next/link";
import { cookies } from "next/headers";

async function getServerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pixel-vpn-web-auth-token")?.value;

  if (!token) {
    return null;
  }

  return { user: null, isAuthenticated: true };
}

export async function HeaderServer() {
  const auth = await getServerUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur">
      <div className="container mx-auto h-full px-4">
        <nav className="h-full flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] md:text-[15px] font-pixel-title text-text-secondary hover:text-text-primary transition-colors"
          >
            <span>pixel-vpn</span>
            <span className="text-text-secondary/40">::</span>
            <span className="text-accent">главная</span>
          </Link>

          <div className="flex items-center gap-1">
            {auth?.isAuthenticated ? (
              <Link
                href="/dashboard"
                className="h-10 px-3 inline-flex items-center border border-transparent text-[12px] md:text-[14px] font-pixel-title tracking-[0.06em] text-text-secondary hover:text-accent hover:border-border transition-colors"
              >
                аккаунт
              </Link>
            ) : (
              <Link
                href="/login"
                className="h-10 px-3 inline-flex items-center border border-transparent text-[12px] md:text-[14px] font-pixel-title tracking-[0.06em] text-text-secondary hover:text-accent hover:border-border transition-colors"
              >
                вход
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export async function FooterServer() {
  const auth = await getServerUser();

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-accent bg-accent/15 text-accent flex items-center justify-center">
              <span className="font-pixel-title text-[13px]">P</span>
            </div>
            <p className="text-[14px] font-pixel-title text-text-secondary">
              pixel-vpn <span className="text-text-secondary/40">::</span> защищенный канал
            </p>
          </div>

          <nav className="flex items-center gap-4 text-[13px] font-pixel-title tracking-[0.06em] text-text-secondary">
            <Link href="/pricing" className="hover:text-accent transition-colors">
              тарифы
            </Link>
            {auth?.isAuthenticated ? (
              <Link href="/dashboard" className="hover:text-accent transition-colors">
                аккаунт
              </Link>
            ) : (
              <Link href="/login" className="hover:text-accent transition-colors">
                вход
              </Link>
            )}
          </nav>

          <a
            href="https://t.me/pixelvpn"
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 border border-border inline-flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
            aria-label="Telegram"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.062.189-.096.252-.096.12 0 .218.032.299.096.08.064.15.159.21.284.163.35.346.86.546 1.523.04.159.05.318.04.477-.01.16-.066.314-.226.462a3.2 3.2 0 0 1-.505.371c-.223.134-.48.198-.77.192a6.4 6.4 0 0 1-.642-.056 20.8 20.8 0 0 1-.828-.152c-.286-.073-.53-.112-.738-.112-.208 0-.416.04-.626.12-.209.081-.376.24-.5.478-.125.239-.187.558-.187.958 0 .213.018.427.054.642.036.215.094.45.175.704.163.51.345.994.546 1.453l.052.14c.09.223.137.413.137.57 0 .14-.046.238-.137.297a.6.6 0 0 1-.327.112c-.113.014-.238.022-.378.022-.28 0-.609-.072-.987-.216a7.7 7.7 0 0 1-.785-.303c-.249-.158-.43-.305-.546-.44-.116-.135-.174-.276-.174-.422 0-.143.052-.275.158-.394.105-.12.262-.25.472-.393.21-.143.456-.303.738-.48.282-.177.6-.346.956-.505.356-.159.688-.293.996-.402.309-.11.58-.177.815-.203.236-.025.413-.014.535.032.121.047.18.132.18.256 0 .127-.055.22-.164.296-.11.074-.265.112-.466.112l-.503-.024c-.166-.008-.305-.051-.415-.128-.111-.077-.166-.18-.166-.31 0-.081.03-.15.09-.208a2.5 2.5 0 0 1 .738-.577c.311-.14.643-.234.996-.283.354-.049.688-.053 1.003-.012.315.04.607.123.877.247.269.125.5.291.692.5.192.208.327.467.404.777.077.31.096.598.058.866-.039.267-.108.518-.208.752-.1.235-.23.446-.39.634-.16.188-.328.35-.505.486a5.4 5.4 0 0 1-.611.414c-.235.14-.485.248-.752.324a8.9 8.9 0 0 1-.813.16c-.269.03-.524.048-.765.053a6.5 6.5 0 0 1-.6-.008 7.8 7.8 0 0 1-.612-.12c-.189-.04-.36-.093-.514-.159a2.8 2.8 0 0 1-.392-.22 3.8 3.8 0 0 0-.4-.232c-.142-.066-.263-.112-.362-.138a2.6 2.6 0 0 1-.288-.064c-.075-.02-.14-.052-.195-.093-.055-.042-.082-.094-.082-.158 0-.058.026-.108.078-.15.052-.042.128-.064.229-.064.098 0 .218.024.36.07.141.048.265.105.371.174.107.07.197.146.271.23.074.084.136.17.187.259l.024.054.052.122c.055.128.122.255.2.38.078.125.17.235.276.33.106.095.236.17.39.224.154.054.334.074.54.06.205-.014.382-.06.53-.14.148-.079.279-.186.392-.32.113-.135.207-.293.283-.475a2 2 0 0 0 .048-.577 1.6 1.6 0 0 0-.192-.475c-.104-.138-.245-.253-.423-.347-.178-.094-.394-.166-.648-.216a5.9 5.9 0 0 0-.812-.104c-.28-.01-.534.01-.762.058-.228.05-.434.127-.618.231a2.4 2.4 0 0 0-.44.362c-.113.138-.19.31-.23.514-.04.204-.055.438-.046.701l.005.133h-.006l-.003.002.01.01z"/>
            </svg>
          </a>
        </div>

        <div className="py-4 border-t border-border text-[14px] text-text-secondary terminal-text">
          <p>
            © {new Date().getFullYear()} Pixel VPN. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}