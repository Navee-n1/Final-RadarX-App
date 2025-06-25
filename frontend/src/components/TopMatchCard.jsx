import React from 'react';
import { User, Star } from 'lucide-react';

export default function TopMatchCard({ match }) {
  const {
    name,
    emp_id,
    vertical,
    score,
    label,
    explanation,
    skills = [],
    experience_years,
  } = match;

  const labelColors = {
    "Highly Recommended": "bg-green-500/20 text-green-300 border-green-400/30",
    "Recommended": "bg-blue-500/20 text-blue-300 border-blue-400/30",
    "Explore": "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  };

  const labelStyle = labelColors[label] || "bg-gray-500/20 text-gray-300 border-gray-400/30";

  return (
    <div className="group bg-white/10 backdrop-blur-lg border border-white/20 p-5 rounded-2xl shadow-xl hover:shadow-cyan-500/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <User className="text-white w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{name}</h3>
            <p className="text-xs text-gray-400">ID: {emp_id}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 border rounded-full ${labelStyle}`}>
          {label}
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-1">{vertical}</p>
      {experience_years && (
        <p className="text-xs text-gray-400 mb-2">{experience_years} years experience</p>
      )}

      <div className="flex items-center gap-2 text-sm mb-2">
        <span className="text-cyan-300 font-semibold">Score:</span>
        <span className="text-white font-bold">{score}%</span>
        <Star className="w-4 h-4 text-yellow-400 fill-current" />
      </div>

      <div className="text-xs text-gray-400 italic mb-3">
        🧠 {explanation?.summary || explanation}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {skills.slice(0, 5).map((skill, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 bg-cyan-400/10 text-cyan-200 border border-cyan-500/20 rounded-full"
            >
              {skill}
            </span>
          ))}
          {skills.length > 5 && (
            <span className="text-xs px-2 py-1 bg-gray-600/10 text-gray-300 border border-gray-400/20 rounded-full">
              +{skills.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
