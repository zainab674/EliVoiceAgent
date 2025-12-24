import { GlassCard } from "@/components/sections/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Mic, Clock } from "lucide-react"
import {
  siSlack,
  siHubspot,
  siSalesforce,
  siGooglecalendar,
  siZapier,
  siCalendly,
  siMake
} from 'simple-icons'

const IntegrationsSection = () => {
  const integrationApps = [
    {
      name: "Slack",
      position: "top-6 left-6",
      icon: siSlack,
      color: "#E01E5A"
    },
    {
      name: "HubSpot",
      position: "top-6 right-6",
      icon: siHubspot,
      color: "#FF7A59"
    },
    {
      name: "Zapier",
      position: "right-6 top-1/2 -translate-y-1/2",
      icon: siZapier,
      color: "#FF4A00"
    },
    {
      name: "Salesforce",
      position: "bottom-6 right-6",
      icon: siSalesforce,
      color: "#00A1E0"
    },
    {
      name: "Google Calendar",
      position: "bottom-6 left-6",
      icon: siGooglecalendar,
      color: "#4285F4"
    },
    {
      name: "Cal.com",
      position: "left-6 top-1/2 -translate-y-1/2",
      icon: siCalendly,
      color: "#006BFF"
    },
    {
      name: "Make",
      position: "top-6 left-1/2 -translate-x-1/2",
      icon: siMake,
      color: "#6B46C1"
    },
    {
      name: "GoHighLevel",
      position: "bottom-6 left-1/2 -translate-x-1/2",
      icon: null,
      color: "#7C3AED"
    }
  ]

  const features = [
    {
      icon: Zap,
      title: "Smart Templates",
      description: "Pre-built conversation flows that adapt to your business needs automatically",
      gradient: "from-blue-500/20 to-purple-500/20"
    },
    {
      icon: Mic,
      title: "Auto Call Recording",
      description: "Capture every conversation with premium analytics and searchable transcripts",
      gradient: "from-green-500/20 to-blue-500/20"
    },
    {
      icon: Clock,
      title: "Scheduled Actions",
      description: "Automate follow-ups, reminders, and outreach based on conversation outcomes",
      gradient: "from-purple-500/20 to-pink-500/20"
    }
  ]

  return (
    <section className="py-16 lg:py-20 bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-white/80 backdrop-blur-md shadow-sm border border-indigo-100 transition-all duration-300 mb-6 text-indigo-600 font-medium px-4 py-1">
            <Zap className="w-4 h-4 mr-2" />
            Integrations
          </Badge>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-4 text-gray-900">
            Automate your <span className="text-indigo-600">workflow</span>
          </h2>
          <p className="text-base font-normal leading-relaxed text-gray-600 max-w-2xl mx-auto">
            Connect your AI voice agent to the tools you already use. Get enterprise-grade integrations
            without the complexity - designed for individuals who want professional results.
          </p>
        </div>

        {/* Central Integration Hub */}
        <div className="mb-20">
          <div className="relative mx-auto w-80 h-80 flex items-center justify-center">
            {/* Central Hub */}
            <div className="rounded-full border border-indigo-200 bg-white shadow-xl shadow-indigo-100 w-32 h-32 flex items-center justify-center relative z-10 p-6 animate-pulse-slow">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <Zap className="w-8 h-8 text-indigo-600" />
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest">AI Core</span>
              </div>
            </div>

            {/* Connection Lines */}
            <div className="absolute inset-0 z-0">
              {integrationApps.map((app, index) => (
                <div
                  key={app.name}
                  className={`absolute w-0.5 h-16 bg-gradient-to-t from-indigo-200 to-transparent transform origin-bottom ${app.position}`}
                  style={{
                    transform: `rotate(${(index * 45) - 90}deg)`,
                  }}
                />
              ))}
            </div>

            {/* App Icons */}
            {integrationApps.map((app) => (
              <div
                key={app.name}
                className={`absolute ${app.position} transform -translate-x-1/2 -translate-y-1/2`}
              >
                <div className="rounded-xl border border-gray-200 bg-white shadow-md hover:shadow-lg w-16 h-16 flex items-center justify-center hover:scale-110 hover:border-indigo-300 transition-all duration-300 cursor-pointer p-3 group">
                  {app.icon ? (
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      className="w-full h-full text-gray-400 group-hover:text-indigo-600 transition-colors"
                      fill="currentColor"
                    >
                      <path d={app.icon.path} />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">
                      GHL
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div key={feature.title} className="bg-white p-6 text-center group hover:-translate-y-2 transition-transform duration-300 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center`}>
                <feature.icon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="bg-indigo-600 text-white font-bold px-8 py-6 text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 rounded-xl">
            Explore All Integrations
          </Button>
        </div>
      </div>
    </section>
  )
}

export { IntegrationsSection }