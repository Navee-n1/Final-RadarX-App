import React, { useState } from 'react';
import axios from 'axios';
import { Briefcase, CheckCircle, AlertTriangle, Pin, ThumbsUp,ThumbsDown,Info} from 'lucide-react';

export default function MatchCard({ match }) {
  const [showExplain, setShowExplain] = useState(false);
  const [voted, setVoted] = useState(null);

  const handleFeedback = async (type) => {
    try {
      await axios.post('http://127.0.0.1:5000/feedback', {
        jd_id: match.jd_id || 0,
        resume_id: match.resume_id,
        vote: type,
        given_by: 'recruiter@hexaware.com',
      });
      setVoted(type);
    } catch (err) {
      console.error('Feedback failed', err);
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl shadow-lg p-5 border border-gray-700 hover:scale-[1.02] transition-transform duration-200">
     <div className="flex items-center gap-4">
    <Briefcase className="w-7 h-7 text-blue-400" />
   
    <div>
      <h3 className="font-bold text-lg bg-gradient-to-br from-purple-300 to-pink-600 text-transparent bg-clip-text">
        JD #{match.jd_id} — {match.job_title || match.file}
      </h3>
      <p className="text-sm text-gray-400">
        Match Score: <span className="font-bold text-pink-600">{match.score*100}%</span>
      </p>
      <p className="text-sm text-gray-400">{match.label}</p>
    </div>
  </div>
   
   
      <div className="mt-4 flex gap-3">
        {match.explanation && (
          <button
            onClick={() => setShowExplain(!showExplain)}
            className="text-sm text-purple-400 hover:underline flex items-center gap-1"
          >
            <Info className="w-4 h-4" />
            {showExplain ? 'Hide Explain Match' : 'Show Explain Match'}
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ThumbsUp
            className={`w-5 h-5 cursor-pointer ${voted === 'up' ? 'text-green-400' : 'text-gray-400'}`}
            onClick={() => handleFeedback('up')}
          />
          <ThumbsDown
            className={`w-5 h-5 cursor-pointer ${voted === 'down' ? 'text-red-400' : 'text-gray-400'}`}
            onClick={() => handleFeedback('down')}
          />
        </div>
      </div>
   
      {showExplain && match.explanation && (
        <div className="mt-4 bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-800 space-y-3 transition-all duration-200">
          {match.explanation.summary && (
            <p>
              <strong><Info className="inline w-4 h-4 mr-1" /> Summary:</strong> {match.explanation.summary}
            </p>
          )}
          {match.explanation.skills_matched?.length > 0 && (
            <p>
              <strong><CheckCircle className="inline w-4 h-4 mr-1 text-green-600" /> Skills Matched:</strong>{' '}
              <span className="text-green-700">{match.explanation.skills_matched.join(', ')}</span>
            </p>
          )}
          {match.explanation.skills_missing?.length > 0 && (
            <p>
              <strong><AlertTriangle className="inline w-4 h-4 mr-1 text-yellow-600" /> Missing Skills:</strong>{' '}
              <span className="text-red-600">{match.explanation.skills_missing.join(', ')}</span>
            </p>
          )}
          {match.explanation.resume_highlights?.length > 0 && (
            <div>
              <p className="font-semibold"><Pin className="inline w-4 h-4 mr-1 text-purple-500" /> Resume Highlights:</p>
              <ul className="list-disc ml-5 text-gray-700">
                {match.explanation.resume_highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
