import React from 'react';

export default function TopMatchCard({ match, isExpanded, onToggleExplain }) {
  const {
    name,
    emp_id,
    vertical = 'Others',
    score = 0,
    label,
    explanation,
    skills = [],
    experience_years,
    rank = 1,
  } = match;

  const labelColors = {
    "Highly Recommended": "bg-green-100 text-green-700 border-green-300",
    "Recommended": "bg-blue-100 text-blue-700 border-blue-300",
    "Explore": "bg-yellow-100 text-yellow-700 border-yellow-300",
  };

  const labelStyle = labelColors[label] || "bg-gray-100 text-gray-800 border-gray-300";

  const rankThemes = {
    1: 'from-yellow-400 to-yellow-600',
    2: 'from-gray-400 to-gray-600',
    3: 'from-orange-500 to-orange-700',
  };

  const verticalColors = {
    Banking: 'bg-blue-100 text-blue-700',
    Healthcare: 'bg-green-100 text-green-700',
    Insurance: 'bg-purple-100 text-purple-700',
    GTT: 'bg-pink-100 text-pink-700',
    HTPS: 'bg-indigo-100 text-indigo-700',
    'GEN-AI': 'bg-yellow-100 text-yellow-800',
    Cloud: 'bg-cyan-100 text-cyan-700',
    Hexavarsity: 'bg-rose-100 text-rose-700',
    Others: 'bg-gray-100 text-gray-700',
  };

  const verticalClass = verticalColors[vertical] || verticalColors['Others'];
  const rankGradient = rankThemes[rank] || 'from-cyan-500 to-indigo-500';

  return (
    <div className="group bg-white/40 backdrop-blur-lg border border-gray-200 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:shadow-purple-200 text-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${rankGradient} rounded-xl flex items-center justify-center`}>
            <span className="text-white text-lg font-bold">{rank}</span>
          </div>
          <div>
            <h3 className="font-semibold text-base">{name}</h3>
            <p className="text-xs text-gray-600">ID: {emp_id}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 border rounded-full ${labelStyle}`}>
          {label}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${verticalClass}`}>
          {vertical}
        </span>
        {experience_years && (
          <span className="text-xs text-gray-700 px-2 py-1 bg-gray-100 rounded-full">
            {experience_years} yrs experience
          </span>
        )}
      </div>

      {/* Score Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-cyan-700">Match Score</span>
          <span className="text-sm font-semibold text-gray-800">{(score * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full"
            style={{ width: `${score * 100}%` }}
          />
        </div>
      </div>

      {/* Explain Match Toggle */}
      {explanation && (
        <button
          onClick={onToggleExplain}
          className="text-xs text-purple-600 font-medium mt-2 underline hover:text-purple-800 transition"
        >
          {isExpanded ? "Hide Explain Match" : "Show Explain Match"}
        </button>
      )}

      {/* Explanation */}
      {isExpanded && explanation && (
        <div className="mt-3 bgwhite-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-800 space-y-3 transition-all duration-200">
          {explanation.summary && (
            <p><strong>📝 Summary:</strong> {explanation.summary}</p>
          )}
          {explanation.skills_matched?.length > 0 && (
            <p>
              <strong>✅ Skills Matched:</strong>{' '}
              <span className="text-green-700">{explanation.skills_matched.join(', ')}</span>
            </p>
          )}
          {explanation.skills_missing?.length > 0 && (
            <p>
              <strong>⚠️ Missing Skills:</strong>{' '}
              <span className="text-red-600">{explanation.skills_missing.join(', ')}</span>
            </p>
          )}
          {explanation.resume_highlights?.length > 0 && (
            <div>
              <p className="font-semibold">📌 Resume Highlights:</p>
              <ul className="list-disc ml-5 text-gray-700">
                {explanation.resume_highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Skill Chips */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {skills.slice(0, 5).map((skill, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-full"
            >
              {skill}
            </span>
          ))}
          {skills.length > 5 && (
            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 border border-gray-300 rounded-full">
              +{skills.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
