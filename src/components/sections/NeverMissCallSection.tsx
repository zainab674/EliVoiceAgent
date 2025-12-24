
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  FileText,
  Brain,
  Shield
} from "lucide-react"

// Removed unused imports

export const NeverMissCallSection = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden bg-slate-50">
      {/* Soft pastel gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/30 to-white" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-rose-50/20" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Header Section */}
        <div className="text-center mb-16 space-y-6">
          <Badge variant="secondary" className="rounded-full bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-600 px-4 py-1 mx-auto">
            <Phone className="w-4 h-4 mr-2" />
            24/7 AI Coverage
          </Badge>

          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-gray-900">
            Never miss a call with
            <span className="text-indigo-600 font-bold"> intelligent AI</span>
          </h2>

          <p className="text-lg md:text-xl font-light leading-relaxed text-gray-600 max-w-3xl mx-auto">
            Your AI voice agent answers every call instantly, books appointments,
            qualifies leads, and handles customer inquiries with human-like intelligence.
          </p>
        </div>

        {/* Unified Container for Benefits and Call Interface */}
        <div className="bg-white/80 backdrop-blur-lg border border-indigo-100 shadow-xl rounded-3xl overflow-hidden mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center p-8 md:p-12">

            {/* Left Content - Key Benefits */}
            <div>
              <div className="flex flex-col space-y-1.5 mb-6">
                <h3 className="text-2xl font-bold leading-none tracking-tight text-gray-900">Key Benefits</h3>
                <p className="text-sm text-gray-500">Why businesses choose our AI voice agent</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-base font-medium leading-relaxed text-gray-700">Instant response, zero wait time</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-base font-medium leading-relaxed text-gray-700">Automatically books appointments</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-base font-medium leading-relaxed text-gray-700">Qualifies leads while you sleep</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-base font-medium leading-relaxed text-gray-700">Detailed call summaries & insights</span>
                </div>
              </div>

              <div className="mt-8">
                <button className="group bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 inline-flex items-center justify-center whitespace-nowrap rounded-full px-8 py-3 text-lg font-medium transition-all duration-300">
                  See it in action
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Side - Enhanced Call Interface Showcase */}
            <div className="relative">
              <div className="relative group max-w-lg mx-auto">
                {/* Premium glass card container */}
                <div className="rounded-3xl border border-indigo-50 bg-white shadow-2xl p-6 relative overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
                  <div className="relative z-10 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <img
                      src="/lovable-uploads/092776e5-4c4b-4eb2-bb10-13b989c394ca.png"
                      alt="AI voice agent call interface showing successful appointment booking"
                      className="w-full h-auto opacity-95 hover:opacity-100 transition-opacity"
                    />
                  </div>

                  {/* Floating UI Elements */}
                  <div className="absolute top-10 right-10 z-20">
                    <Badge className="bg-white/90 text-indigo-600 border-indigo-100 shadow-sm backdrop-blur-md">
                      <Brain className="w-3 h-3 mr-1" />
                      Live AI
                    </Badge>
                  </div>

                  {/* Status indicator */}
                  <div className="absolute bottom-10 left-10 z-20 flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-600">Call in progress</span>
                  </div>
                </div>

                {/* Enhanced ambient lighting effects */}
                <div className="absolute -inset-4 bg-indigo-100 rounded-3xl opacity-40 blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards - Elegant Refined Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
            <div className="flex items-start space-x-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Call summaries</h3>
                <p className="text-xs text-indigo-600 font-medium tracking-wide uppercase">Analysis included</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Every conversation is automatically transcribed and summarized with key information highlighted.
            </p>
          </div>

          <div className="relative group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
            <div className="flex items-start space-x-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Brain className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Expert knowledge</h3>
                <p className="text-xs text-indigo-600 font-medium tracking-wide uppercase">Custom Training</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Train your AI agent with your specific knowledge base for accurate, personalized responses.
            </p>
          </div>

          <div className="relative group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
            <div className="flex items-start space-x-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Total oversight</h3>
                <p className="text-xs text-indigo-600 font-medium tracking-wide uppercase">Monitoring</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Monitor performance, review conversations, and optimize your agent with intuitive dashboards.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}