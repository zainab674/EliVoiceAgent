
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Palette,
  Crown,
  ArrowRight,
  Check,
  Zap,
  TrendingUp
} from "lucide-react"

export const WhiteLabelSection = () => {
  const partnerBenefits = [
    {
      icon: Zap,
      metric: "0%",
      label: "Technical Overhead",
      description: "No developers or technical team needed"
    },
    {
      icon: TrendingUp,
      metric: "3x",
      label: "Client LTV",
      description: "AI voice agents increase client retention"
    },
    {
      icon: Palette,
      metric: "100%",
      label: "Custom Branding",
      description: "Complete white-label solution with your brand"
    }
  ]

  return (
    <section className="py-24 px-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-white pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge variant="secondary" className="bg-white shadow-sm border border-indigo-100 transition-all duration-300 mb-6 text-indigo-600 font-medium px-4 py-1">
            <Crown className="w-4 h-4 mr-2" />
            White-Label Solution
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-gray-900">
            Your Brand<br />
            <span className="text-indigo-600">Our Technology</span>
          </h2>
          <p className="text-lg md:text-xl font-light leading-relaxed text-gray-600 max-w-3xl mx-auto">
            Launch your own AI voice agent platform under your brand. Our complete white-label solution
            gives you everything needed to offer enterprise-grade voice AI to your clients.
          </p>
        </div>

        {/* Partner Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {partnerBenefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center p-8 group hover:scale-105 hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                <div className="inline-flex p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6 group-hover:bg-indigo-100 transition-colors">
                  <Icon className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-4xl font-mono font-bold text-indigo-600 mb-3">
                  {benefit.metric}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  {benefit.label}
                </h3>
                <p className="text-base font-normal leading-relaxed text-gray-500">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>


        {/* Partnership CTA */}
        <div className="text-center">
          <div className="relative overflow-hidden p-12 bg-white rounded-3xl border border-indigo-100 shadow-xl">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-transparent to-indigo-50/50 pointer-events-none" />

            <div className="relative z-10">
              <h3 className="text-3xl font-light mb-4 text-gray-900">
                Become a <span className="text-indigo-600 font-bold">White-Label Partner</span>
              </h3>
              <p className="text-lg md:text-xl font-light leading-relaxed text-gray-600 mb-8 max-w-2xl mx-auto">
                Launch your AI voice agent service in 48 hours. No technical team required,
                no development costs. Start capturing new revenue opportunities immediately.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button size="lg" className="px-8 py-4 bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all rounded-xl">
                  Apply for Partnership
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4 bg-white border border-indigo-200 text-indigo-600 text-lg hover:bg-indigo-50 rounded-xl">
                  Schedule Partnership Call
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-500 flex-wrap">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600" />
                  <span>Dedicated partner manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600" />
                  <span>Technical onboarding support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600" />
                  <span>Marketing co-op programs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}