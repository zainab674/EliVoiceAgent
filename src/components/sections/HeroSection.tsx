import { Badge } from "@/components/ui/badge"
import { VoiceDemo } from "@/components/ui/voice-demo"
import { Play, ArrowRight, Users, Tag, Wand2, Shield } from "lucide-react"

// Hero section component
export const HeroSection = () => {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden bg-slate-50">
      {/* Ambient Background Effects - Soft Pastel */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-white to-white" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Social Proof Badge */}
        <div className="flex justify-center mb-8 animate-[fadeInUp_0.6s_ease-out_forwards]">
          <Badge variant="secondary" className="bg-white/80 backdrop-blur-md shadow-sm border border-indigo-100 transition-all duration-300 text-indigo-600 px-6 py-2 text-sm font-medium">
            <Users className="w-4 h-4 mr-2" />
            Trusted by 50,000+ businesses worldwide
          </Badge>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-extralight tracking-tight leading-tight mb-8 animate-[fadeInUp_0.6s_ease-out_forwards] font-extrabold text-gray-900" style={{ animationDelay: "0.1s" }}>
          Ultimate <span className="text-indigo-600" data-text="Conversational AI">Conversational AI</span>
          <br />
          Solution for Agencies
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl font-light leading-relaxed text-gray-600 max-w-3xl mx-auto mb-8 animate-[fadeInUp_0.6s_ease-out_forwards]" style={{ animationDelay: "0.2s" }}>
          Plug-and-play voice AI that agencies can white-label instantly. Easily create AI voice agents for outbound calling, inbound support, and automated scheduling - all under your brand. No coding required.
        </p>



        {/* CTA Button */}
        <div className="flex justify-center mb-16 animate-[fadeInUp_0.6s_ease-out_forwards]" style={{ animationDelay: "0.3s" }}>
          <button
            className="group relative inline-flex items-center justify-center whitespace-nowrap rounded-full bg-indigo-600 px-10 py-4 text-base font-medium text-white shadow-lg shadow-indigo-200 transition-all duration-300 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            onClick={scrollToPricing}
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-[fadeInUp_0.6s_ease-out_forwards]" style={{ animationDelay: "0.4s" }}>
          <div className="bg-white/80 backdrop-blur-md transition-all duration-300 text-center p-6 border border-indigo-50 shadow-sm rounded-2xl hover:shadow-md hover:border-indigo-100">
            <div className="flex items-center justify-center mb-3">
              <Tag className="w-6 h-6 text-indigo-600 mr-2" />
              <span className="text-lg font-medium text-gray-900">White Label Ready</span>
            </div>
            <p className="text-sm text-gray-500">Complete branding control</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md transition-all duration-300 text-center p-6 border border-indigo-50 shadow-sm rounded-2xl hover:shadow-md hover:border-indigo-100">
            <div className="flex items-center justify-center mb-3">
              <Wand2 className="w-6 h-6 text-indigo-600 mr-2" />
              <span className="text-lg font-medium text-gray-900">No Coding Required</span>
            </div>
            <p className="text-sm text-gray-500">Setup in minutes, not months</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md transition-all duration-300 text-center p-6 border border-indigo-50 shadow-sm rounded-2xl hover:shadow-md hover:border-indigo-100">
            <div className="flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-indigo-600 mr-2" />
              <span className="text-lg font-medium text-gray-900">Enterprise Grade</span>
            </div>
            <p className="text-sm text-gray-500">Reliable, secure, scalable</p>
          </div>
        </div>

        {/* Trusted Companies */}
        <div className="mt-20 mb-16 animate-[fadeInUp_0.6s_ease-out_forwards]" style={{ animationDelay: "0.5s" }}>
          <p className="text-sm font-light text-gray-400 text-center mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 text-gray-400">
            {["TechCorp", "SalesFlow", "CustomerFirst", "GrowthLabs", "ScaleUp"].map((company) => (
              <div key={company} className="text-lg font-light tracking-wide hover:text-indigo-600 transition-colors cursor-default">
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}