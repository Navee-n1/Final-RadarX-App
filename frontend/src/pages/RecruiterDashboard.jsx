// File: RecruiterDashboard.jsx

import React, { useState } from 'react';
import ResumeMatchSection from '../components/ResumeMatchSection';
import OneToOneMatchSection from '../components/OneToOneMatchSection';
import ViewJDMatches from '../components/ViewJDMatches';
import AnimatedHeader from '../components/AnimatedHeader';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function RecruiterDashboard({ onLogout }) {
const [activeSection, setActiveSection] = useState('upload');
const [profileFile, setProfileFile] = useState(null);
const [empId, setEmpId] = useState('');
const [name, setName] = useState('');
const [vertical, setVertical] = useState('');
const [status, setStatus] = useState('');
const [searchName, setSearchName] = useState('');
const [searchEmpId, setSearchEmpId] = useState('');
const [searchVertical, setSearchVertical] = useState('');
const [searchSkills, setSearchSkills] = useState('');
const [minExp, setMinExp] = useState('');
const [maxExp, setMaxExp] = useState('');
const [searchResults, setSearchResults] = useState([]);

const handleResumeUpload = (e) => setProfileFile(e.target.files[0]);

const uploadProfile = async () => {
if (!empId || !name || !profileFile) {
alert("Please fill EmpID, Name and select Resume.");
return;
}
const formData = new FormData();
formData.append('file', profileFile);
formData.append('emp_id', empId);
formData.append('name', name);
formData.append('vertical', vertical);


try {
  const res = await axios.post('http://127.0.0.1:5000/upload-profile', formData);
  setStatus('✅ Profile uploaded successfully');
} catch (err) {
  console.error(err);
  setStatus('❌ Upload failed');
}
};

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
});
setSearchResults(res.data);
} catch (err) {
console.error("Search failed", err);
alert("❌ Failed to fetch profiles.");
}
};

return (
<div className="bg-[#0a0a0a] text-white min-h-screen font-sans">
<AnimatedHeader title="RadarX – Recruiter Dashboard" onLogout={onLogout} />

  <main className="max-w-screen-xl mx-auto px-6 py-10 space-y-10">
    {/* Navbar-like Section Switch */}
    <div className="flex justify-center flex-wrap gap-4 mb-6">
      {[
        ['upload', '📤 Upload Profile'],
        ['resume', '🔄 Resume → JD'],
        ['onetoone', '🔗 One-to-One'],
        ['jds', '📂 View JDs'],
        ['search', '🔍 Search Profiles'],
      ].map(([key, label]) => (
        <button
          key={key}
          onClick={() => setActiveSection(key)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
            activeSection === key
              ? 'bg-cyan-400 text-black shadow-md'
              : 'bg-white/10 text-white hover:bg-cyan-500/20'
          }`}
        >
          {label}
        </button>
      ))}
    </div>

    <AnimatePresence mode="wait">
      {activeSection === 'upload' && (
        <motion.section
          key="upload"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white/5 border border-white/20 p-8 rounded-2xl shadow-xl space-y-6"
        >
          <h2 className="text-xl font-bold text-cyan-300">Upload Consultant Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={empId} onChange={e => setEmpId(e.target.value)} placeholder="Employee ID" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" />
            <input value={vertical} onChange={e => setVertical(e.target.value)} placeholder="Vertical (Optional)" className="bg-gray-800 px-4 py-2 rounded border border-gray-600 col-span-2" />
          </div>
          <div className="w-full">
            <label className="bg-gray-800 border border-gray-600 px-4 py-3 text-center rounded cursor-pointer block hover:bg-gray-700">
              📎 Choose Resume File
              <input type="file" onChange={handleResumeUpload} className="hidden" />
            </label>
            {profileFile && <p className="text-sm text-green-400 mt-2">✅ {profileFile.name}</p>}
          </div>
          <button onClick={uploadProfile} className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-6 py-2 rounded font-bold shadow-lg hover:from-cyan-300 hover:to-blue-400 transition">
            🚀 Upload Profile
          </button>
          {status && <p className="text-sm text-accent mt-1">{status}</p>}
        </motion.section>
      )}

      {activeSection === 'resume' && (
        <motion.section
          key="resume"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white/5 border border-white/20 p-8 rounded-2xl shadow-xl"
        >
          <ResumeMatchSection />
        </motion.section>
      )}

      {activeSection === 'onetoone' && (
        <motion.section
          key="onetoone"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white/5 border border-white/20 p-8 rounded-2xl shadow-xl"
        >
          <OneToOneMatchSection />
        </motion.section>
      )}

      {activeSection === 'jds' && (
        <motion.section
          key="jds"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white/5 border border-white/20 p-8 rounded-2xl shadow-xl"
        >
          <ViewJDMatches />
        </motion.section>
      )}

      {activeSection === 'search' && (
        <motion.section
          key="search"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white/5 border border-white/20 p-8 rounded-2xl shadow-xl space-y-6"
        >
          <h2 className="text-xl font-bold text-cyan-300">🔍 Search Consultant Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Name" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setSearchName(e.target.value)} />
            <input placeholder="EmpID" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setSearchEmpId(e.target.value)} />
            <input placeholder="Vertical" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setSearchVertical(e.target.value)} />
            <input placeholder="Skills (comma-separated)" className="bg-gray-800 px-4 py-2 rounded border border-gray-600 col-span-2" onChange={e => setSearchSkills(e.target.value)} />
            <input placeholder="Min Exp" type="number" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setMinExp(e.target.value)} />
            <input placeholder="Max Exp" type="number" className="bg-gray-800 px-4 py-2 rounded border border-gray-600" onChange={e => setMaxExp(e.target.value)} />
          </div>
          <button onClick={handleSearch} className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-6 py-2 rounded font-bold shadow-lg hover:from-cyan-300 hover:to-blue-400 transition">
            🔍 Run Search
          </button>

          {searchResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-cyan-300">Matching Profiles</h3>
              <ul className="space-y-4">
                {searchResults.map((p, i) => (
                  <li key={i} className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-600">
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
  </main>
</div>
);
}