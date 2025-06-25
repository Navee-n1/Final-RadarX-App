import React, { useState } from 'react'
import ResumeMatchSection from '../components/ResumeMatchSection'
import OneToOneMatchSection from '../components/OneToOneMatchSection'
import ViewJDMatches from '../components/ViewJDMatches'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function RecruiterDashboard() {
  const [activeSection, setActiveSection] = useState('upload')
  const [profileFile, setProfileFile] = useState(null)
  const [empId, setEmpId] = useState('')
  const [name, setName] = useState('')
  const [vertical, setVertical] = useState('')
  const [status, setStatus] = useState('')

  // Consultant search state
  const [searchName, setSearchName] = useState('')
  const [searchEmpId, setSearchEmpId] = useState('')
  const [searchVertical, setSearchVertical] = useState('')
  const [searchSkills, setSearchSkills] = useState('')
  const [minExp, setMinExp] = useState('')
  const [maxExp, setMaxExp] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const handleResumeUpload = (e) => setProfileFile(e.target.files[0])

  const uploadProfile = async () => {
    if (!empId || !name || !profileFile) {
      alert("Please fill EmpID, Name and select Resume.")
      return
    }
    const formData = new FormData()
    formData.append('file', profileFile)
    formData.append('emp_id', empId)
    formData.append('name', name)
    formData.append('vertical', vertical)

    try {
      const res = await axios.post('http://127.0.0.1:5000/upload-profile', formData)
      setStatus('✅ Profile uploaded successfully')
    } catch (err) {
      console.error(err)
      setStatus('❌ Upload failed')
    }
  }

  const handleSearch = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/profiles/search', {
        params: {
          name: searchName,
          emp_id: searchEmpId,
          vertical: searchVertical,
          skills: searchSkills,
          min_exp: minExp,
          max_exp: maxExp
        }
      })
      setSearchResults(res.data)
    } catch (err) {
      console.error("Search failed", err)
      alert("❌ Failed to fetch profiles.")
    }
  }

  return (
    <div className="w-full max-w-screen-md mx-auto px-4 py-6 space-y-10">
      {/* Navigation Tabs */}
      <div className="flex justify-center gap-4 flex-wrap mb-6">
        <button onClick={() => setActiveSection('upload')} className={`px-5 py-2 rounded-full text-sm font-semibold ${activeSection === 'upload' ? 'bg-accent text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>📤 Upload Profile</button>
        <button onClick={() => setActiveSection('resume')} className={`px-5 py-2 rounded-full text-sm font-semibold ${activeSection === 'resume' ? 'bg-accent text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>🔄 Resume → JD</button>
        <button onClick={() => setActiveSection('onetoone')} className={`px-5 py-2 rounded-full text-sm font-semibold ${activeSection === 'onetoone' ? 'bg-accent text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>🔗 One-to-One</button>
        <button onClick={() => setActiveSection('jds')} className={`px-5 py-2 rounded-full text-sm font-semibold ${activeSection === 'jds' ? 'bg-accent text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>📂 View JDs</button>
        <button onClick={() => setActiveSection('search')} className={`px-5 py-2 rounded-full text-sm font-semibold ${activeSection === 'search' ? 'bg-accent text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>🔍 Search Profiles</button>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'upload' && (
          <motion.section key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#151515] border border-gray-700 rounded-2xl p-8 shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-accent">Upload Consultant Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={empId} onChange={e => setEmpId(e.target.value)} placeholder="Employee ID" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" />
              <input value={vertical} onChange={e => setVertical(e.target.value)} placeholder="Vertical (Optional)" className="bg-gray-800 px-4 py-2 rounded border border-gray-600 col-span-2" />
            </div>
            <div className="relative w-full">
              <label className="bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded cursor-pointer inline-block w-full text-center hover:bg-gray-700 transition">
                📎 Choose Resume File
                <input type="file" onChange={handleResumeUpload} className="hidden" />
              </label>
              {profileFile && <p className="text-sm text-green-400 mt-2">✅ {profileFile.name}</p>}
            </div>
            <button onClick={uploadProfile} className="bg-accent text-black font-semibold py-2 px-6 rounded-lg hover:bg-cyan-400 transition">🚀 Upload Profile</button>
            {status && <p className="text-sm text-accent">{status}</p>}
          </motion.section>
        )}

        {activeSection === 'resume' && (
          <motion.section key="resume" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#151515] border border-gray-700 rounded-2xl p-8 shadow-lg">
            <ResumeMatchSection />
          </motion.section>
        )}

        {activeSection === 'onetoone' && (
          <motion.section key="onetoone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#151515] border border-gray-700 rounded-2xl p-8 shadow-lg">
            <OneToOneMatchSection />
          </motion.section>
        )}

        {activeSection === 'jds' && (
          <motion.section key="jds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#151515] border border-gray-700 rounded-2xl p-8 shadow-lg">
            <ViewJDMatches />
          </motion.section>
        )}

        {activeSection === 'search' && (
          <motion.section key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#151515] border border-gray-700 rounded-2xl p-8 shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-accent">🔍 Search Consultant Profiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Name" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setSearchName(e.target.value)} />
              <input placeholder="EmpID" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setSearchEmpId(e.target.value)} />
              <input placeholder="Vertical" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setSearchVertical(e.target.value)} />
              <input placeholder="Skills (comma-separated)" className="bg-gray-800 px-4 py-2 rounded border border-gray-600 col-span-2" onChange={e => setSearchSkills(e.target.value)} />
              <input placeholder="Min Exp" type="number" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setMinExp(e.target.value)} />
              <input placeholder="Max Exp" type="number" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setMaxExp(e.target.value)} />
            </div>
            <button onClick={handleSearch} className="bg-accent text-black font-semibold py-2 px-6 rounded hover:bg-cyan-400 transition">🔍 Run Search</button>

            {searchResults.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-accent">🔎 Matching Profiles</h3>
                <ul className="space-y-4">
                  {searchResults.map((p, i) => (
                    <li key={i} className="bg-[#222] p-4 rounded-xl border border-gray-600">
                      <p className="font-bold text-white mb-1">{p.name} ({p.emp_id}) – {p.vertical}</p>
                      <p className="text-gray-300">Experience: {p.experience_years} yrs</p>
                      <p className="text-gray-400 text-sm">Skills: {p.skills}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
