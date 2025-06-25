import React, { useState } from 'react'
import ResumeMatchSection from '../components/ResumeMatchSection'
import OneToOneMatchSection from '../components/OneToOneMatchSection'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

export default function ARRequestorDashboard() {
  const [activeSection, setActiveSection] = useState('upload')
  const [jdFile, setJdFile] = useState(null)
  const [jdId, setJdId] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({
    compared: false,
    ranked: false,
    emailed: false,
  })
  const [toEmail, setToEmail] = useState('')
  const [cc, setCc] = useState('')
  const [topMatches, setTopMatches] = useState([])

  const handleFileChange = (e) => setJdFile(e.target.files[0])

  const uploadJD = async () => {
    if (!jdFile) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', jdFile)
    formData.append('uploaded_by', 'ar@hexaware.com')
    formData.append('project_code', 'HEX-JD-BULK')
    const res = await axios.post('http://127.0.0.1:5000/upload-jd', formData)
    setJdId(res.data.jd_id)
    setProgress(p => ({ ...p, compared: true }))
    setStatus('✅ JD uploaded. Matching resumes...')
    runMatching(res.data.jd_id)
  }

  const runMatching = async (jdId) => {
    const res = await axios.post('http://127.0.0.1:5000/match/jd-to-resumes', { jd_id: jdId })
    if (res.data.top_matches && res.data.top_matches.length > 0) {
      setTopMatches(res.data.top_matches)
      setProgress(p => ({ ...p, ranked: true }))
      setStatus('✅ Profiles ranked. Recruiter notified.')
    } else {
      setStatus('⚠️ No matches found.')
    }
    setProgress(p => ({ ...p, emailed: true }))
    setLoading(false)
  }

  const handleSendEmail = async () => {
    if (!toEmail) return alert("To email required")
    try {
      const res = await axios.post("http://127.0.0.1:5000/send-email/manual", {
        jd_id: jdId,
        to_email: toEmail,
        cc_list: cc.split(',').map(e => e.trim()).filter(Boolean),
        attachments: topMatches.map(m => m.file_path),
        subject: `Top Matches for JD ${jdId}`,
        body: `Hello,\n\nPlease find the top matches for JD ID ${jdId}.\n\nRegards,\nRadarX`
      })
      alert(res.data.message)
    } catch (err) {
      console.error("❌ Email failed", err)
      alert("❌ Email failed. See console.")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d] text-white px-4 py-8 md:flex-row gap-8">
      {/* Left: Vertical Progress Tracker */}
      <div className="w-full md:w-1/4 bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 shadow-lg sticky top-20 h-fit md:h-full">
        <h2 className="text-lg font-bold mb-6 text-accent">📊 JD Progress Tracker</h2>
        <div className="space-y-5 text-sm">
          <ProgressItem label="JD Compared" active={progress.compared} />
          <ProgressItem label="Profiles Ranked" active={progress.ranked} />
          <ProgressItem label="Top 3 Profiles Identified" active={(topMatches?.length || 0) === 3} />
          <ProgressItem label="Email Sent" active={progress.emailed} />
        </div>
      </div>

      {/* Right: JD Upload & Content */}
      <div className="w-full md:w-3/4 space-y-10">
        {/* Section Tabs */}
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={() => setActiveSection('upload')} className={`px-6 py-2 rounded-full font-semibold text-sm ${activeSection === 'upload' ? 'bg-accent text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>📤 Upload JD</button>
          <button onClick={() => setActiveSection('resume')} className={`px-6 py-2 rounded-full font-semibold text-sm ${activeSection === 'resume' ? 'bg-accent text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>🔄 Resume → JD</button>
          <button onClick={() => setActiveSection('onetoone')} className={`px-6 py-2 rounded-full font-semibold text-sm ${activeSection === 'onetoone' ? 'bg-accent text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>🔗 One-to-One</button>
        </div>

        <AnimatePresence mode="wait">
          {activeSection === 'upload' && (
            <motion.section
              key="upload"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#151515] border border-gray-700 rounded-2xl p-8 shadow-lg space-y-6"
            >
              <h3 className="text-xl font-bold text-accent">Upload JD & Start Matching</h3>
              <label className="block bg-gray-800 border border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition">
                📎 Choose JD File
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
              {jdFile && <p className="text-sm text-green-400">✅ {jdFile.name}</p>}

              <button
                onClick={uploadJD}
                disabled={!jdFile || loading}
                className="bg-accent text-black font-semibold py-2 px-6 rounded-lg hover:bg-cyan-400 transition disabled:opacity-40"
              >
                {loading ? 'Processing...' : '🔍 Upload & Match'}
              </button>

              {status && <p className="text-sm text-accent">{status}</p>}

              {topMatches.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-accent">Top 3 Consultant Matches</h3>
                  <ul className="space-y-4">
                    {topMatches.map((match, i) => (
                      <li key={i} className="bg-[#222] p-4 rounded-xl shadow-md border border-gray-600">
                        <div className="font-bold text-white mb-1">
                          {i + 1}. {match.name} ({match.emp_id}) – {match.vertical}
                        </div>
                        <div className="text-gray-300">Score: <span className="text-accent font-semibold">{match.score}</span> — {match.label}</div>
                        <div className="text-gray-400 text-sm mt-1">🧠 {match.explanation?.summary || 'Detailed explanation available in report.'}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.section>
          )}

          {progress.emailed && (
            <motion.section
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6 shadow space-y-4"
            >
              <h3 className="text-lg font-semibold text-accent">📧 Email Top Matches</h3>
              <input
                type="email"
                placeholder="To (Recruiter Email)"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-600 text-sm"
              />
              <input
                type="text"
                placeholder="CC (comma-separated)"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-600 text-sm"
              />
              <button
                onClick={handleSendEmail}
                className="bg-accent text-black py-2 px-6 rounded hover:bg-cyan-400 transition font-semibold"
              >
                📩 Send Email
              </button>
            </motion.section>
          )}

          {activeSection === 'resume' && (
            <motion.section
              key="resume"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#151515] border border-gray-700 rounded-2xl p-8 shadow-lg"
            >
              <ResumeMatchSection />
            </motion.section>
          )}

          {activeSection === 'onetoone' && (
            <motion.section
              key="onetoone"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#151515] border border-gray-700 rounded-2xl p-8 shadow-lg"
            >
              <OneToOneMatchSection />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ProgressItem({ label, active }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className={`w-4 h-4 rounded-full ${active ? 'bg-accent' : 'bg-gray-600'}`} />
      <span className={active ? 'text-white' : 'text-gray-400'}>{label}</span>
    </div>
  )
}
