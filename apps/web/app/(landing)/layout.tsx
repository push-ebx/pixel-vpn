// Layout для группы landing pages
import "./globals.css";

export const metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
