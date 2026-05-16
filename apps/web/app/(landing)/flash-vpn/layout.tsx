import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "../globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flash VPN — Молниеносный VPN для свободы",
  description: "Flash VPN — самый быстрый VPN с неоновым интерфейсом. Мгновенное подключение, низкая задержка.",
};

export default function FlashVpnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${spaceGrotesk.className} bg-slate-950 text-white`}>
        <div className="relative overflow-hidden">
          {/* Background glow effects */}
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[150px] pointer-events-none" />
          <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[150px] pointer-events-none" />
          {children}
        </div>
      </body>
    </html>
  );
}
