import React, { useState, useEffect } from 'react';
import RecruiterDashboard from './pages/RecruiterDashboard'
import ARRequestorDashboard from './pages/ARRequestorDashboard'
import LoginPage from './pages/LoginPage';
import './App.css'
import './index.css'

function App() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole === 'recruiter' || storedRole === 'ar') {
      setRole(storedRole);
    } else {
      localStorage.removeItem('role');  // clean bad value
      setRole(null);  // force login
    }
  }, []);
 
  const handleLogin = (userRole) => {
    setRole(userRole); // ✅ This triggers rerender to dashboard
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    setRole(null); // 👈 This brings the user back to LoginPage
  };
 

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">
      <header className="sticky top-3 z-50 bg-black border-b border-gray-700 px-6 py-5 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold text-accent">RadarX</h1>
      </header>
 
      {/* 👇 Routing based on login */}
      {!role ? (
      <LoginPage onLogin={handleLogin} />
      ) : role === 'Recruiter' ? (
      <RecruiterDashboard onLogout={handleLogout} />
      ) : role === 'AR Requisitor' ? (
      <ARRequestorDashboard onLogout={handleLogout} />
      ) : (
      <p className="text-center mt-10">❌ Unknown role</p>
      )}
 
      <footer className="text-center text-xs text-gray-500 py-6 border-t border-gray-700 mt-16">
        Built with ❤️ by <span className="text-accent font-semibold">House of Starks</span>
      </footer>
    </div>
  );
}

export default App
