import React, { useState } from 'react'
import axios from 'axios'
import MatchCard from './MatchCard'

export default function ResumeMatchSection() {
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeId, setResumeId] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResumeFile(file.name)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)

    const res = await axios.post('http://127.0.0.1:5000/upload-resume', formData)
    setResumeId(res.data.resume_id)
    setMatches([])
  }

  const runMatch = async () => {
    if (!resumeId) return
    setLoading(true)
    const res = await axios.post('http://127.0.0.1:5000/match/resume-to-jds', {
      resume_id: resumeId
    },{withCredentials: true})
    setMatches(res.data.top_matches)
    setLoading(false)
  }

  return (
    <div className="bg-[#1a1a1a] mt-10 p-6 rounded-2xl shadow-lg border border-gray-800">
      <h2 className="text-lg font-semibold mb-4 text-accent">Resume → JD Match</h2>

      <div className="space-y-3">
        <div className="relative w-full">
  <label className="bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded cursor-pointer inline-block w-full text-center hover:bg-gray-700 transition">
    📎 Choose Resume File
    <input type="file" onChange={handleUpload} className="hidden" />
  </label>
  {resumeFile && <p className="text-sm text-green-400 mt-2">✅Uploaded: {resumeFile}</p>}
</div>

        
        <button
          onClick={runMatch}
          disabled={!resumeId}
          className="mt-2 bg-accent text-black font-semibold py-2 px-6 rounded-lg shadow-md disabled:opacity-30"
        >
          🔍 Match Against JDs
        </button>
      </div>

      {loading && <p className="mt-4 text-yellow-300">Matching in progress...</p>}

      {matches.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-medium mb-2">Top Matching JDs:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m, i) => (
              <MatchCard key={i} match={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
