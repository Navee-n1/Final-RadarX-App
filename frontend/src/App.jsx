import React, { useState } from 'react'
import RecruiterDashboard from './pages/RecruiterDashboard'
import ARRequestorDashboard from './pages/ARRequestorDashboard'
import './App.css'
import './index.css'

function App() {
  const [role, setRole] = useState('recruiter')

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">
      {/* Fixed Top Header */}
      <header className="sticky top-1 z-10 bg-black border-b border-gray-700 px-6 py-5 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold text-accent">RadarX</h1>
        <div className="space-x-4">
          <button
            onClick={() => setRole('recruiter')}
            className={`px-7 py-1 rounded ${
              role === 'recruiter' ? 'bg-accent text-black' : 'bg-800 text-white'
            }`}
          >
            Recruiter
          </button>
          <button
            onClick={() => setRole('ar')}
            className={`px-7 py-1 rounded ${
              role === 'ar' ? 'bg-accent text-black' : 'bg-black-800 text-white'
            }`}
          >
            AR Requestor
          </button>
        </div>
      </header>

      {role === 'recruiter' ? <RecruiterDashboard /> : <ARRequestorDashboard />}
      {/* Footer */}
       <footer class="text-center text-xs text-gray-500 py-6 border-t border-gray-700 mt-16">
    Built with ❤️ by <span class="text-accent font-semibold">House of Starks</span> 🛡️ for Hexaware Mavericks 2025
  </footer>

    </div>
  )
}

export default App
