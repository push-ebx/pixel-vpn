import { FlashHeader } from "./components/FlashHeader";
import { FlashHero } from "./components/FlashHero";
import { FlashMarquee } from "./components/FlashMarquee";
import { FlashFeatures } from "./components/FlashFeatures";
import { FlashServers } from "./components/FlashServers";
import { FlashPricing } from "./components/FlashPricing";
import { FlashDownload } from "./components/FlashDownload";
import { FlashFooter } from "./components/FlashFooter";
import { Toaster } from "@/components/ui/Toaster";
import { getPlansServer } from "@/lib/plans";

export default async function FlashVpnPage() {
  const plans = await getPlansServer("flash-vpn");

  return (
    <>
      <FlashHeader />
      <main className="relative z-10">
        <FlashHero />
        <FlashMarquee />
        <FlashFeatures />
        <FlashServers />
        <FlashPricing plans={plans} />
        <FlashDownload />
      </main>
      <FlashFooter />
      <Toaster />
    </>
  );
}
