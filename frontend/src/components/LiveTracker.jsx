import React from 'react';
import { FileText, Users, Trophy, Mail, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LiveTracker({ jdId, progress = {}, topMatches = [], emailSent = false }) {
  const { compared = false, ranked = false, emailed = false } = progress;

  const steps = [
    {
      name: 'JD Analysis',
      icon: FileText,
      active: compared,
      description: 'JD uploaded and parsed',
      details: '✓ JD text extracted ✓ Skills identified',
    },
    {
      name: 'Profile Comparison',
      icon: Users,
      active: ranked,
      description: 'Consultant profiles compared',
      details: '✓ Similarity scores calculated',
    },
    {
      name: 'Intelligent Ranking',
      icon: Trophy,
      active: topMatches.length === 3,
      description: 'Top 3 profiles identified',
      details: '✓ Profiles ranked and validated',
    },
    {
      name: 'Email Preparation',
      icon: Mail,
      active: emailed && emailSent,
      description: 'Email sent to recruiter',
      details: emailSent ? '✓ Email sent successfully' : '📬 Ready to send',
    },
  ];

  const currentIndex = steps.findIndex((s) => !s.active);
  const progressPercent = currentIndex === -1 ? 100 : (currentIndex / steps.length) * 100;

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-xl space-y-8 transition-all duration-300">
      <h3 className="text-lg font-bold text-white">🧠 Matching Progress – JD-{jdId}</h3>

      {/* Neuron Progress Bar */}
      <div className="relative w-full h-20">
        {/* Background Line */}
        <div className="absolute top-[36px] left-0 w-full h-1 bg-gray-700 rounded-full z-0" />

        {/* SVG Glowing Neuron Lines */}
        <div className="absolute top-[34px] left-0 w-full h-2 z-10 flex justify-between items-center px-[6px]">
          {steps.map((step, i) => {
            if (i === steps.length - 1) return null;
            const nextActive = steps[i + 1].active;
            return (
              <div key={i} className="w-full h-full relative">
                <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id={`glow-line-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={step.active ? '#00ffff' : '#444'} />
                      <stop offset="100%" stopColor={nextActive ? '#00ffff' : '#444'} />
                    </linearGradient>
                  </defs>
                  <line
                    x1="0"
                    y1="5"
                    x2="100"
                    y2="5"
                    stroke={`url(#glow-line-${i})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="animate-glow"
                  />
                </svg>
              </div>
            );
          })}
        </div>

        {/* Fill Bar */}
        <div className="absolute top-[34px] left-0 w-full h-2 rounded-full overflow-hidden z-20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
          />
        </div>

        {/* Pulse Orb */}
        <motion.div
          className="absolute top-[24px] w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_15px_5px_rgba(0,255,255,0.6)] animate-pulse z-30"
          animate={{ left: `calc(${progressPercent}% - 12px)` }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />

        {/* Step Icons */}
        <div className="absolute top-4 left-0 w-full flex justify-between z-40">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center w-1/4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${
                  step.active ? 'bg-green-500 border-green-300' : 'bg-gray-800 border-gray-600'
                }`}
              >
                {step.active ? (
                  <CheckCircle className="text-white w-5 h-5" />
                ) : (
                  <step.icon className="text-white w-5 h-5" />
                )}
              </div>
              <div className="mt-2 text-xs text-center text-gray-300">{step.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Animated Action Text (Single Step Only) */}
      <div className="text-center mt-4">
        {steps
          .slice()
          .reverse()
          .find((step) => step.active) && (
          <motion.div
            key={steps.findIndex((s) => s.active)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            className="inline-block bg-white/10 px-6 py-3 rounded-xl border border-white/20 backdrop-blur-md shadow-lg"
          >
            <div className="text-lg text-white italic tracking-wide font-light">
              <span className="text-cyan-400"></span> {
                steps
                  .slice()
                  .reverse()
                  .find((step) => step.active)?.details
              }
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
