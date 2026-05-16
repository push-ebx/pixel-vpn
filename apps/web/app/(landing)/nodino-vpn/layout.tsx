import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "../globals.css";

const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NoDino VPN — Интернет всегда с вами",
  description: "Забудьте о странице без интернета. NoDino VPN обеспечивает стабильное соединение 24/7.",
};

export default function NoDinoVpnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${nunito.className} bg-slate-900 text-white`}>
        {children}
      </body>
    </html>
  );
}
