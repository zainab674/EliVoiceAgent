
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Crown, Calculator } from "lucide-react"
import { PLAN_CONFIGS } from "@/lib/plan-config"

export const PricingSection = () => {
  // Map plan configs to pricing section format
  // Note: This section uses different pricing/ROI values for marketing purposes
  // If you want to use the same prices as plan-config.ts, replace the price values below
  const plans = [
    {
      name: PLAN_CONFIGS.starter.name,
      price: `$${PLAN_CONFIGS.starter.price}`,
      period: "/month",
      description: "Perfect for small businesses getting started with AI voice agents",
      variant: "default" as const,
      features: PLAN_CONFIGS.starter.features,
      roi: "$2,500",
      roiLabel: "Monthly ROI",
      popular: false
    },
    {
      name: PLAN_CONFIGS.professional.name,
      price: `$${PLAN_CONFIGS.professional.price}`,
      period: "/month",
      description: "Advanced features for growing teams that need more power",
      variant: "premium" as const,
      features: PLAN_CONFIGS.professional.features,
      roi: "$8,500",
      roiLabel: "Monthly ROI",
      popular: true
    },
    {
      name: PLAN_CONFIGS.enterprise.name,
      price: "Custom",
      period: "",
      description: "Tailored solutions for large organizations with custom needs",
      variant: "enterprise" as const,
      features: PLAN_CONFIGS.enterprise.features,
      roi: "$50,000+",
      roiLabel: "Monthly ROI",
      popular: false
    }
  ]

  return (
    <section className="py-24 px-4 relative bg-indigo-50/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-white shadow-sm border border-indigo-100 transition-all duration-300 mb-6 text-indigo-600 font-medium px-4 py-1">
            <Calculator className="w-4 h-4 mr-2" />
            ROI-Focused Pricing
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-gray-900">
            Pricing That Scales
            <br />
            <span className="text-indigo-600">With Your Success</span>
          </h2>
          <p className="text-lg md:text-xl font-light leading-relaxed text-gray-600 max-w-3xl mx-auto mb-8">
            Every plan pays for itself. Our customers typically see 300-500% ROI within the first quarter.
          </p>

          {/* ROI Calculator Teaser */}
          <div className="inline-block mb-8 p-1 bg-white rounded-lg border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-3 p-3">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Calculate your potential ROI</span>
              <button className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors">
                Free Calculator
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl transition-all duration-300 hover:shadow-lg relative p-6 ${plan.popular ? 'border-2 border-indigo-500 shadow-md scale-105 z-10' : 'border border-gray-100 hover:border-indigo-100'}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-end justify-center gap-1 mb-3">
                  <span className="text-4xl font-extrabold text-indigo-600">{plan.price}</span>
                  <span className="text-sm text-gray-500 mb-1">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              {/* ROI Highlight */}
              <div className="text-center mb-6">
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 font-medium">
                  {plan.roi} {plan.roiLabel}
                </Badge>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${plan.popular
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                }`}>
                {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
              </button>

              {/* Money-back guarantee */}
              <p className="text-xs text-center text-gray-400 mt-3">
                30-day money-back guarantee
              </p>
            </div>
          ))}
        </div>

        {/* Additional Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
            <Zap className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900 mb-2">Setup in Minutes</h4>
            <p className="text-sm text-gray-500">No technical expertise required. We handle the setup for you.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
            <Crown className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900 mb-2">No Long-term Contracts</h4>
            <p className="text-sm text-gray-500">Cancel anytime. Month-to-month flexibility with enterprise security.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
            <Star className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900 mb-2">Dedicated Success Manager</h4>
            <p className="text-sm text-gray-500">Personal support to maximize your ROI and growth potential.</p>
          </div>
        </div>

      </div>
    </section>
  )
}