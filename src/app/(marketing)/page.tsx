import { Capabilities } from "@/components/marketing/capabilities";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { ProductPreview } from "@/components/marketing/product-preview";

export default function MarketingPage() {
  return (
    <>
      <MarketingNav />
      <main className="min-w-0 overflow-x-clip">
        <Hero />
        <ProductPreview />
        <Capabilities />
        <HowItWorks />
        <FinalCta />
      </main>
      <MarketingFooter />
    </>
  );
}