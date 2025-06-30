import React from 'react';

const avatarColors = [
  'from-purple-500 to-pink-500',
  'from-sky-500 to-blue-500',
  'from-green-500 to-emerald-500',
  'from-yellow-400 to-orange-500',
  'from-indigo-500 to-cyan-500',
  'from-rose-500 to-fuchsia-500',
  'from-lime-500 to-teal-500',
];

const skillColorClasses = [
  'bg-pink-100 text-pink-800',
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-orange-100 text-orange-800',
  
  'bg-indigo-100 text-indigo-800',
];
function getSkillColor(skill) {
  let hash = 0;
  for (let i = 0; i < skill.length; i++) {
    hash = skill.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % skillColorClasses.length;
  return skillColorClasses[index];
}


export default function SearchResultsCard({ results, viewMode = 'grid' }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-2">🧑‍💻</div>
        <h3 className="text-xl font-semibold text-gray-800">No consultants found</h3>
        <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6" : "space-y-4 mt-6"}>
      {results.map((p, i) => {
        const avatarColor = avatarColors[i % avatarColors.length];
        const skills = (p.skills?.split(',') || []).map(skill => skill.trim());

        return (
          <div
            key={i}
            className={`p-6 rounded-2xl border border-gray-200 shadow-lg backdrop-blur-xl bg-white/50 transition-all ${
              viewMode === 'grid' ? 'hover:scale-[1.02]' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${avatarColor} text-white flex items-center justify-center text-lg font-bold`}>
                  {p.name?.charAt(0) ?? 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {p.name} <span className="text-sm text-gray-500">({p.emp_id})</span>
                  </h3>
                  <p className="text-sm text-gray-600">{p.vertical}</p>
                </div>
              </div>
              <div className="text-sm text-gray-700 font-medium">{p.experience_years} yrs</div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Skills</p>
              <div className="flex flex-wrap gap-2">
                {(p.skills?.split(',') || []).map((skill, idx) => (
  <span
    key={idx}
    className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getSkillColor(skill.trim())}`}
  >
    {skill.trim()}
  </span>
))}

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
