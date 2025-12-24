import React from 'react'
import { Home, Settings, Phone, DollarSign, Users, Tag, Wand2, Shield, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/SupportAccessAuthContext'
import { useNavigate } from 'react-router-dom'

export const TopCTA = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const scrollToPricing = () => {
    const el = document.getElementById('pricing')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const handleDashboardClick = () => {
    navigate('/dashboard')
  }

  const handleLoginClick = () => {
    navigate('/login')
  }

  return (
    <div className="fixed top-4 right-8 z-50 flex items-center gap-3 bg-white/90 backdrop-blur-lg border border-indigo-100 rounded-full px-4 py-2 shadow-md ring-1 ring-gray-900/5">
      {user ? (
        <button
          onClick={handleDashboardClick}
          className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors px-3 py-1 rounded-full hover:bg-indigo-50"
        >
          Dashboard
        </button>
      ) : (
        <>
          <button
            onClick={handleLoginClick}
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors px-3 py-1 rounded-full hover:bg-indigo-50"
          >
            Log In
          </button>
          <button
            onClick={scrollToPricing}
            className="bg-indigo-600 text-white px-5 py-2 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all duration-300 font-medium"
          >
            Free Trial
          </button>
        </>
      )}

    </div>
  )
}
