import React from 'react';
import { motion } from 'framer-motion';
import { Radar } from 'lucide-react';

export default function AnimatedHeader({ title = "RadarX – Recruiter Dashboard", onLogout }) {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full bg-black/70 backdrop-blur-md border-b border-white/10 shadow-lg"
    >
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Icon shimmer */}
          <motion.div
            className="p-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/40 shadow-md"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Radar className="text-white w-6 h-6" />
          </motion.div>
          <h1 className="text-xl font-bold text-cyan-400 tracking-wider">{title}</h1>
        </div>

        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 transition px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md"
        >
          Logout
        </button>
      </div>
    </motion.header>
  );
}
