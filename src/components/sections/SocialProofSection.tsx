
import { Badge } from "@/components/ui/badge"
import { Star, Quote, TrendingUp, Users, Award } from "lucide-react"

export const SocialProofSection = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "VP of Sales",
      company: "TechFlow Solutions",
      content: "Our lead conversion rate jumped from 12% to 52% in just 3 months. The AI agents handle initial qualification better than our human reps.",
      metric: "340% ROI",
      avatar: "SC"
    },
    {
      name: "Marcus Rodriguez",
      role: "CEO",
      company: "GrowthLabs",
      content: "We went from missing 60% of after-hours calls to capturing every single lead. It's like having a sales team that never sleeps.",
      metric: "$1.2M additional revenue",
      avatar: "MR"
    },
    {
      name: "Emily Watson",
      role: "Customer Success Director",
      company: "ScaleUp Inc",
      content: "The consistency is incredible. Every customer gets the same premium experience, and our satisfaction scores increased by 40%.",
      metric: "40% satisfaction increase",
      avatar: "EW"
    }
  ]

  const stats = [
    { icon: Users, value: "50,000+", label: "Active Users" },
    { icon: TrendingUp, value: "99.9%", label: "Uptime SLA" },
    { icon: Star, value: "4.9/5", label: "Customer Rating" },
    { icon: Award, value: "15+", label: "Industry Awards" }
  ]

  const companies = [
    { name: "TechFlow", industry: "Technology" },
    { name: "SalesForce Pro", industry: "Sales" },
    { name: "CustomerFirst", industry: "Support" },
    { name: "GrowthLabs", industry: "Marketing" },
    { name: "ScaleUp Inc", industry: "SaaS" },
    { name: "Contact Elite", industry: "Services" }
  ]

  return (
    <section className="py-24 px-4 relative bg-indigo-50/10">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/20 to-white" />

      <div className="site-container relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-white shadow-sm border border-indigo-100 transition-all duration-300 mb-6 text-indigo-600 font-medium px-4 py-1">
            <Star className="w-4 h-4 mr-2" />
            Customer Success Stories
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-gray-900">
            Trusted by Industry Leaders
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            See why thousands of businesses trust our AI voice agents to drive their growth and customer satisfaction.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:border-indigo-100 transition-colors">
                <Icon className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 hover:shadow-lg transition-all duration-300 group relative">
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-8 h-8 text-indigo-600" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-indigo-400 text-indigo-400" />
                ))}
              </div>

              {/* Testimonial Content */}
              <blockquote className="text-gray-600 mb-6 relative z-10 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">{testimonial.avatar}</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                  <div className="text-sm font-medium text-indigo-600">{testimonial.company}</div>
                </div>
              </div>

              {/* Result Badge */}
              <div className="mt-6 pt-6 border-t border-gray-50">
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
                  {testimonial.metric}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Company Logos */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Powering success across industries
            </h3>
            <p className="text-sm text-gray-500">
              From startups to Fortune 500 companies
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {companies.map((company, index) => (
              <div key={index} className="text-center group">
                <div className="text-lg font-light text-gray-400 group-hover:text-indigo-600 transition-colors mb-1 cursor-default">
                  {company.name}
                </div>
                <div className="text-xs text-gray-300 group-hover:text-indigo-400 transition-colors">
                  {company.industry}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-indigo-600 text-white rounded-3xl p-12 inline-block shadow-xl shadow-indigo-100 max-w-4xl w-full">
            <h3 className="text-2xl font-bold mb-4 text-white">
              Join thousands of satisfied customers
            </h3>
            <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
              See why industry leaders choose our AI voice agents for their growth strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-sm">
                Read More Success Stories
              </button>
              <button className="px-6 py-3 bg-indigo-700/50 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors border border-indigo-500">
                Start Your Success Story
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}