import { NovaHeader } from "./components/NovaHeader";
import { NovaHero } from "./components/NovaHero";
import { NovaStats } from "./components/NovaStats";
import { NovaFeatures } from "./components/NovaFeatures";
import { NovaHowItWorks } from "./components/NovaHowItWorks";
import { NovaPricing } from "./components/NovaPricing";
import { NovaTestimonials } from "./components/NovaTestimonials";
import { NovaFAQ } from "./components/NovaFAQ";
import { NovaCTA } from "./components/NovaCTA";
import { NovaFooter } from "./components/NovaFooter";
import { Toaster } from "@/components/ui/Toaster";
import { getPlansServer } from "@/lib/plans";

export default async function NovaVpnPage() {
  const plans = await getPlansServer("nova-vpn");

  return (
    <>
      <NovaHeader />
      <main>
        <NovaHero />
        <NovaStats />
        <NovaFeatures />
        <NovaHowItWorks />
        <NovaPricing plans={plans} />
        <NovaTestimonials />
        <NovaFAQ />
        <NovaCTA />
      </main>
      <NovaFooter />
      <Toaster />
    </>
  );
}
