
import { FeatureShowcase } from "@/components/sections/FeatureShowcase";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { HeroSection } from "@/components/sections/HeroSection";
import { IntegrationsSection } from "@/components/sections/IntegrationsSection";

import { PricingSection } from "@/components/sections/PricingSection";
import { UseCaseSection } from "@/components/sections/UseCaseSection";
import { ValuePropositionSection } from "@/components/sections/ValuePropositionSection";
import { WhiteLabelSection } from "@/components/sections/WhiteLabelSection";
import { Footer } from "@/components/sections/Footer";
import { FloatingNav } from "@/components/ui/floating-nav";
import { TopCTA } from "@/components/ui/top-cta";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <FloatingNav />
      <TopCTA />

      {/* Hero - Light Gradient Grid */}
      <div className="relative bg-gradient-to-b from-indigo-50/50 via-white to-white">
        <HeroSection />
      </div>

      {/* Use Cases - White with subtle pattern */}
      <div className="bg-white text-slate-900 relative border-y border-slate-100">
        <UseCaseSection />
      </div>

      {/* Value Proposition - Light Pastel */}
      <div className="bg-indigo-50/30 text-slate-900 border-y border-indigo-100/50">
        <ValuePropositionSection />
      </div>

      {/* Feature Showcase - White */}
      <div className="bg-white text-slate-900">
        <FeatureShowcase />
      </div>

      {/* White-Label - Pastel Gradient */}
      <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-rose-50/30 text-slate-900 relative border-y border-slate-100">
        <WhiteLabelSection />
      </div>

      {/* Integrations - Light Gray */}
      <div className="bg-slate-50 text-slate-900 border-y border-slate-200/50">
        <IntegrationsSection />
      </div>

      {/* Pricing - White */}
      <div id="pricing" className="bg-white text-slate-900 relative">
        <PricingSection />
      </div>

      {/* Final CTA - Pastel Brand */}
      <div className="bg-indigo-600 text-white border-t border-indigo-500">
        <FinalCTASection />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-100">
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
