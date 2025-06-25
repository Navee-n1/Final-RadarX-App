import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  // ✅ Fixed import
 
export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
 
  const handleLogin = async () => {
    try {
const res = await axios.post('http://127.0.0.1:5000/login', { email, password });
      const token = res.data.access_token;
 
      const decoded = jwtDecode(token);  // ✅ No error now
      console.log("✅ JWT Decoded:", decoded);
 
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', decoded.sub.role);
      localStorage.setItem('email', decoded.sub.email);
      onLogin(decoded.sub.role);  // 🔁 Redirect based on role
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials');
    }
  };
 
  return (
    <div className="flex flex-col gap-4 items-center mt-20">
     <input
  type="email"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="p-3 rounded w-80 bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
/>
 
<input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="p-3 rounded w-80 bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
/>
      <button
        onClick={handleLogin}
        className="bg-accent text-black font-semibold px-6 py-2 rounded"
      >
        Login
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}