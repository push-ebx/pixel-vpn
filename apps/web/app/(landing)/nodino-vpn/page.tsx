import { NoDinoHeader } from "./components/NoDinoHeader";
import { NoDinoHero } from "./components/NoDinoHero";
import { NoDinoFeatures } from "./components/NoDinoFeatures";
import { NoDinoHowItWorks } from "./components/NoDinoHowItWorks";
import { NoDinoPricing } from "./components/NoDinoPricing";
import { NoDinoFooter } from "./components/NoDinoFooter";
import { Toaster } from "@/components/ui/Toaster";
import { getPlansServer } from "@/lib/plans";

export default async function NoDinoVpnPage() {
  const plans = await getPlansServer("nodino-vpn");

  return (
    <>
      <NoDinoHeader />
      <main>
        <NoDinoHero />
        <NoDinoFeatures />
        <NoDinoHowItWorks />
        <NoDinoPricing plans={plans} />
      </main>
      <NoDinoFooter />
      <Toaster />
    </>
  );
}
