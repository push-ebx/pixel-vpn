import { Hero } from "@/components/Landing/Hero";
import { Features } from "@/components/Landing/Features";
import { Clients } from "@/components/Landing/Clients";
import { Footer } from "@/components/Landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Clients />
      <Footer />
    </main>
  );
}
