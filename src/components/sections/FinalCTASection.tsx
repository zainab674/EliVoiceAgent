import { ArrowRight, Check } from "lucide-react"

export const FinalCTASection = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-t from-indigo-50 to-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="p-12 bg-white/60 backdrop-blur-md rounded-3xl border border-indigo-100 shadow-xl">
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900 tracking-tight">
            Ready to Transform Your
            <br />
            <span className="text-indigo-600">Customer Experience?</span>
          </h2>

          {/* Subheading */}
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of businesses already using AI voice agents to drive growth.
            No setup fees, no hidden costs, and no risk with our 30-day guarantee.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <button className="group px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all">
              Get Personalized Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600" />
              <span>Start your risk-free trial today</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600" />
              <span>Setup in under 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}