import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function ViewJDMatches() {
  const [jds, setJDs] = useState([])
  const [search, setSearch] = useState('')
  const [selectedJD, setSelectedJD] = useState(null)
  const [topMatches, setTopMatches] = useState([])
  const [toEmail, setToEmail] = useState('')
  const [ccList, setCcList] = useState([])

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/jds').then(res => setJDs(res.data))
  }, [])

  const filteredJDs = jds.filter(jd =>
    jd.project_code.toLowerCase().includes(search.toLowerCase()) ||
    jd.uploaded_by?.toLowerCase().includes(search.toLowerCase())
  )

  const fetchMatches = async (jdId) => {
    setSelectedJD(jdId)
    const res = await axios.post('http://127.0.0.1:5000/match/jd-to-resumes', { jd_id: jdId })
    setTopMatches(res.data.top_matches || [])
  }

  const sendEmail = async () => {
    if (!toEmail || !selectedJD || topMatches.length === 0) return alert('Fill all fields')

    const payload = {
      jd_id: selectedJD,
      to_email: toEmail,
      cc_list: ccList.split(',').map(e => e.trim()),
      attachments: topMatches.map(m => m.file_path),
      subject: `Top Matches for JD #${selectedJD}`,
      body: `Hi,\n\nPlease find the top matching consultant profiles for JD #${selectedJD}.\n\nThanks,\nRadarX`
    }

    try {
      const res = await axios.post('http://127.0.0.1:5000/send-email/manual', payload)
      alert(res.data.message)
    } catch (err) {
      console.error(err)
      alert('Email failed')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-accent mb-4">📂 Uploaded JDs</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by Project Code or Uploaded By"
        className="mb-4 w-full px-4 py-2 rounded bg-[#222] border border-gray-600 text-white"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* JD List */}
      <div className="space-y-2">
        {filteredJDs.length === 0 ? (
          <p className="text-gray-500 text-sm">No matching JDs found.</p>
        ) : (
          filteredJDs.map(jd => (
            <button
              key={jd.id}
              onClick={() => fetchMatches(jd.id)}
              className={`w-full text-left px-4 py-3 rounded bg-[#222] border border-gray-600 hover:bg-gray-700 transition ${
                selectedJD === jd.id ? 'bg-accent text-black font-semibold' : 'text-white'
              }`}
            >
              JD #{jd.id} — {jd.job_title} ({jd.uploaded_by})
            </button>
          ))
        )}
      </div>

      {/* Match Results */}
      {topMatches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3 text-accent">🏆 Top 3 Matches</h3>
          <div className="space-y-4">
            {topMatches.map((match, i) => (
              <div
                key={i}
                className="p-4 bg-[#1c1c1c] border border-gray-700 rounded-lg"
              >
                <div className="flex justify-between text-sm">
                  <span>{match.file}</span>
                  <span className="text-accent">{match.label}</span>
                </div>
                <div className="text-xs text-gray-500">Score: {match.score}</div>
                <div className="text-xs text-gray-400 italic">
                  🧠 {typeof match.explanation === 'string'
                    ? match.explanation.slice(0, 140)
                    : match.explanation?.summary || 'Match explanation'}
                </div>
              </div>
            ))}
          </div>

          {/* Email Controls */}
          <div className="mt-6 space-y-2">
            <input
              type="email"
              placeholder="To Email"
              className="w-full px-4 py-2 bg-[#222] border border-gray-600 rounded"
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="CC (comma-separated)"
              className="w-full px-4 py-2 bg-[#222] border border-gray-600 rounded"
              value={ccList}
              onChange={e => setCcList(e.target.value)}
            />
            <div className="flex gap-4">
              <button
                onClick={sendEmail}
                className="bg-accent text-black font-semibold px-6 py-2 rounded hover:bg-cyan-400 transition"
              >
                📧 Send Matches
              </button>
              <a
                href={`http://127.0.0.1:5000/static/reports/jd_${selectedJD}_report.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black font-semibold px-6 py-2 rounded hover:bg-gray-300 transition"
              >
                📄 Download PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
