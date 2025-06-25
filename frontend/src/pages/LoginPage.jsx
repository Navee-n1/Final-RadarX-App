import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';


export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ar'); // 'ar' or 'recruiter'
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:5000/login', { email, password });
      const token = res.data.access_token;
      const decoded = jwtDecode(token);
      localStorage.setItem('token', token);
      localStorage.setItem('role', decoded.sub.role);
      localStorage.setItem('email', decoded.sub.email);
      onLogin(decoded.sub.role);
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0f0f0f] to-[#040404] text-white font-sans relative overflow-hidden">

      {/* === Neon Glow Behind Login === */}
      <div className="absolute inset-0 flex justify-center items-center -z-10">
        <div className="w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[140px] animate-glow-pulse shadow-[0_0_80px_30px_rgba(34,211,238,0.15)]" />
      </div>

      {/* === Additional Floating Orbs === */}
      <div className="absolute -top-20 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
      <div className="absolute -bottom-20 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]" />

      {/* === Branding === */}
      <div className="absolute top-10 text-center w-full z-20">
        <h1 className="text-4xl font-extrabold tracking-wider">
  <span className="text-white">Radar</span>
  <span className="text-red-500">X</span>
</h1>

        <p className="text-sm text-gray-400 italic mt-1">The Radar for Talent</p>
      </div>

      {/* === Glass Login Card === */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-lg border border-white/20 rounded-3xl shadow-lg space-y-6">

        {/* Role Switch */}
        <div className="flex justify-center gap-4 mb-6">
          {['ar', 'recruiter'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300
                ${role === r
                  ? 'bg-cyan-400 text-black shadow-md'
                  : 'bg-white/10 hover:bg-cyan-500/20 text-white'
                }`}
            >
              {r === 'ar' ? 'AR Requestor' : 'Recruiter'}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />

        {/* Submit */}
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-bold shadow-md transition-all"
        >
          Login
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
