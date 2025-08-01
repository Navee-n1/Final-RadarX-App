import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Pin,
  UserRound,
  Bot,
  BadgeCheck,
  StickyNote
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import ConsultantEmailModal from './ConsultantEmailModal';
 
export default function TopMatchCard({ match }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConsultantEmailModal, setShowConsultantEmailModal] = useState(false);
 
  const recruiterEmail = localStorage.getItem('email') || '';
  const {
    name,
    emp_id,
    vertical = 'Others',
    score = 0,
    label,
    explanation,
    skills = [],
    experience_years,
    resume_path,
    file_path,
    rank = 1,
    email,
    jd_id,
    jd_title
  } = match;
 
  const safeExplanation =
    typeof explanation === 'string'
      ? JSON.parse(explanation || '{}')
      : explanation || {};
 
  const labelColors = {
    "Highly Recommended": "bg-green-100 text-green-700 border-green-300",
    "Recommended": "bg-blue-100 text-blue-700 border-blue-300",
    "Explore": "bg-yellow-100 text-yellow-700 border-yellow-300"
  };
  const labelStyle = labelColors[label] || "bg-gray-100 text-gray-800 border-gray-300";
 
  const verticalColors = {
    Banking: 'bg-blue-100 text-blue-700',
    Healthcare: 'bg-green-100 text-green-700',
    Insurance: 'bg-purple-100 text-purple-700',
    GTT: 'bg-pink-100 text-pink-700',
    HTPS: 'bg-indigo-100 text-indigo-700',
    'GEN-AI': 'bg-yellow-100 text-yellow-800',
    Cloud: 'bg-cyan-100 text-cyan-700',
    Hexavarsity: 'bg-rose-100 text-rose-700',
    Others: 'bg-gray-100 text-gray-700'
  };
  const verticalClass = verticalColors[vertical] || verticalColors['Others'];
 
  const rankThemes = {
    1: 'bg-yellow-400 text-white',
    2: 'bg-gray-400 text-white',
    3: 'bg-orange-400 text-white'
  };
  const rankClass = rankThemes[rank] || 'bg-cyan-400 text-white';
 
  const previewURL = resume_path
? `http://127.0.0.1:5000${resume_path}`
    : file_path
? `http://127.0.0.1:5000${file_path}`
    : null;
 
  return (
    <div className="w-full p-6 rounded-3xl bg-white/80 border shadow-xl space-y-4 text-gray-800 border-transparent transition-shadow hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:border-grey-400 duration-300">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between p-5 rounded-2xl border border-white/20 shadow-md backdrop-blur-lg bg-white/30 bg-gradient-to-br from-white/40 to-white/10 gap-4 min-h-[88px]">
          {/* Left: User Info */}
          <div className="flex items-center gap-3 w-[250px]">
            <div className="bg-purple-100 text-purple-700 p-2 rounded-full">
              <UserRound size={20} />
            </div>
            <div className="truncate">
              <h2 className="text-lg font-semibold truncate">{name}</h2>
              <p className="text-sm text-gray-500">Emp ID: {emp_id}</p>
            </div>
          </div>
 
          {/* Center: Vertical + Score */}
          <div className="flex gap-2 text-sm items-center w-[220px] justify-center">
            <span className={`px-4 py-1 text-sm font-medium rounded-full shadow-sm ${verticalClass}`}>{vertical}</span>
            <span className="px-4 py-1 text-sm font-medium bg-cyan-100 text-cyan-800 rounded-full shadow-sm">
              Score: {(score * 100).toFixed(0)}%
            </span>
          </div>
 
          {/* Right: Label */}
          <div className="w-[160px] flex justify-end pr-2">
            <span className={`text-xs font-semibold px-4 py-1 rounded-full border border-gray-300 bg-white/60 text-gray-700 ${labelStyle}`}>
              {label}
            </span>
          </div>
        </div>
 
        {/* Meta Info + Actions */}
        <div className="flex justify-between items-center mt-3 flex-wrap gap-3">
          <div className="flex gap-4 text-sm">
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              Explain Match {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {previewURL && (
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye size={16} />
                {showPreview ? 'Hide Resume' : 'View Resume'}
              </button>
            )}
          </div>
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`text-[2rem] font-extrabold leading-none ${
              rank === 1
                ? 'bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-100 text-transparent bg-clip-text'
                : rank === 2
                ? 'bg-gradient-to-r from-gray-500 via-gray-300 to-gray-100 text-transparent bg-clip-text'
                : 'bg-gradient-to-r from-orange-500 via-orange-300 to-yellow-200 text-transparent bg-clip-text'
            }`}
          >
            #{rank}
          </motion.span>
        </div>
 
        {/* Send Email for Recommended Only */}
        {['✅ Highly Recommended', '☑️ Recommended'].includes(label) && (
  <button
    onClick={() => setShowConsultantEmailModal(true)}
    className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
  >
    ✉️ Send Email
  </button>
)}
      </motion.div>
 
      {/* Skills Rendering */}
      <div className="flex flex-wrap gap-2">
        {(() => {
          const skillArray = Array.isArray(skills)
            ? skills
            : typeof skills === 'string'
            ? skills.split(',').map(s => s.trim())
            : [];
          return (
            <>
              {skillArray.slice(0, 8).map((skill, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                >
                  {skill}
                </span>
              ))}
              {skillArray.length > 8 && (
                <span className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded-full border">
                  +{skillArray.length - 8} more
                </span>
              )}
            </>
          );
        })()}
      </div>
 
      {/* Resume Preview */}
      {showPreview && previewURL && (
        <div className="mt-4 border rounded-xl overflow-hidden shadow-lg h-[500px]">
          <iframe title="Resume Preview" src={previewURL} width="100%" height="100%" className="rounded-xl" />
        </div>
      )}
 
      {/* Explanation */}
      {isExpanded && (
        <div className="mt-4 p-4 border-white rounded-xl space-y-4 text-sm">
          {safeExplanation.gpt_summary && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center gap-2 mb-1 text-purple-800 font-semibold">
                <Sparkles size={16} />
                Summary
              </div>
              <div className="text-gray-800 whitespace-pre-line">{safeExplanation.gpt_summary}</div>
            </div>
          )}
          {safeExplanation.summary && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 mb-1 text-blue-700 font-semibold">
                <StickyNote size={16} />
                Semantic Summary
              </div>
              <div>{safeExplanation.summary}</div>
            </div>
          )}
          {safeExplanation.skills_matched?.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 mb-1 text-green-700 font-semibold">
                <BadgeCheck size={16} />
                Matched Skills
              </div>
              <div className="text-sm">{safeExplanation.skills_matched.join(', ')}</div>
            </div>
          )}
          {safeExplanation.skills_missing?.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 mb-1 text-red-600 font-semibold">
                <AlertTriangle size={16} />
                Missing Skills
              </div>
              <div className="text-sm">{safeExplanation.skills_missing.join(', ')}</div>
            </div>
          )}
          {safeExplanation.resume_highlights?.length > 0 && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
              <div className="flex items-center gap-2 mb-1 text-indigo-800 font-semibold">
                <Pin size={16} />
                Highlights
              </div>
              <ul className="list-disc ml-6 text-gray-800 leading-relaxed text-sm">
                {safeExplanation.resume_highlights.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
 
      {/* Consultant Email Modal */}
      {showConsultantEmailModal && (
        <ConsultantEmailModal
          match={{ email, name, jd_id, jd_title }}
          fromEmail={localStorage.getItem('email')}
          onClose={() => setShowConsultantEmailModal(false)}
        />
      )}
    </div>
  );
}