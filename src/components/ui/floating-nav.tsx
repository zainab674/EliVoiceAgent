import React from 'react'
import { Home, Settings, Phone, DollarSign } from 'lucide-react'

// ---------------- Floating Nav ----------------
const navItems = [
  { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" />, href: '#hero' },
  { id: 'features', label: 'Features', icon: <Settings className="h-4 w-4" />, href: '#features' },
  { id: 'pricing', label: 'Pricing', icon: <DollarSign className="h-4 w-4" />, href: '#pricing' },
  { id: 'contact', label: 'Contact', icon: <Phone className="h-4 w-4" />, href: '#contact' }
]

export const FloatingNav = () => {
  const [activeSection, setActiveSection] = React.useState('home')

  const scrollToSection = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id')
          if (id) setActiveSection(id)
        }
      })
    }, { threshold: 0.6 })

    navItems.forEach((item) => {
      const el = document.querySelector(item.href)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center bg-white/90 backdrop-blur-lg border border-indigo-100 shadow-md rounded-full p-1.5 ring-1 ring-gray-900/5">
      {navItems.map((item) => {
        const isActive = activeSection === item.id
        return (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.href)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}