import React, { useState } from 'react'
import { FaUserTie, FaThumbsUp, FaThumbsDown } from 'react-icons/fa'
import axios from 'axios'

export default function MatchCard({ match }) {
  const [showExplain, setShowExplain] = useState(false)
  const [voted, setVoted] = useState(null)

  const handleFeedback = async (type) => {
    try {
      await axios.post('http://127.0.0.1:5000/feedback', {
        jd_id: match.jd_id || 0,
        resume_id: match.resume_id,
        vote: type,
        given_by: 'recruiter@hexaware.com'
      })
      setVoted(type)
    } catch (err) {
      console.error('Feedback failed', err)
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-2xl shadow-lg p-5 border border-gray-700 hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-center gap-4">
        <FaUserTie className="text-accent text-3xl" />
        <div>
          
          <h3 className="font-bold text-lg text-gray-100">
  JD #{match.jd_id} — {match.job_title || match.file}
</h3>
          <p className="text-sm text-gray-400">Match Score: <span className="text-white">{match.score}</span></p>
          <p className="text-sm">{match.label}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setShowExplain(!showExplain)}
          className="text-sm text-accent hover:underline"
        >
          {showExplain ? 'Hide Explanation' : 'Explain Match'}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            className={`text-xl ${voted === 'up' ? 'text-green-400' : 'text-gray-400'}`}
            onClick={() => handleFeedback('up')}
          >
           
          </button>
          <button
            className={`text-xl ${voted === 'down' ? 'text-red-400' : 'text-gray-400'}`}
            onClick={() => handleFeedback('down')}
          >
         
          </button>
        </div>
      </div>

      {showExplain && match.explanation && (
  <div className="mt-4 bg-[#222] p-4 rounded-lg text-sm text-gray-300 space-y-2">
    {match.explanation.summary && (
      <p><strong>Summary:</strong> {match.explanation.summary}</p>
    )}

    {match.explanation.skills_matched?.length > 0 && (
      <p><strong>Skills Matched:</strong> {match.explanation.skills_matched.join(', ')}</p>
    )}

    {match.explanation.skills_missing?.length > 0 && (
      <p><strong>Missing Skills:</strong> {match.explanation.skills_missing.join(', ')}</p>
    )}

    {match.explanation.resume_highlights?.length > 0 && (
      <>
        <p><strong>Resume Highlights:</strong></p>
        <ul className="list-disc ml-5">
          {match.explanation.resume_highlights.map((highlight, i) => (
            <li key={i}>{highlight}</li>
          ))}
        </ul>
      </>
    )}
  </div>
)}
    </div>
  )
}
