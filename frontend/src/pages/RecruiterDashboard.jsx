import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResumeToJDPage from './ResumeToJDPage';
import OneToOneMatchPage from './OneToOneMatchPage';
import ViewJDMatches from '../components/ViewJDMatches';
import { motion, AnimatePresence } from 'framer-motion';
import SearchResultsCard from '../components/SearchResultsCard';
import { useNavigate } from 'react-router-dom';

const verticalOptions = ['Banking', 'Healthcare', 'Insurance', 'GTT', 'HTPS', 'GEN-AI', 'Cloud', 'Hexavarsity', 'Others'];

export default function RecruiterDashboard() {
  const [activeSection, setActiveSection] = useState('upload');
  const [profileFile, setProfileFile] = useState(null);
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [vertical, setVertical] = useState('');
  const [experience, setExperience] = useState('');
  const [status, setStatus] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmpId, setSearchEmpId] = useState('');
  const [searchVertical, setSearchVertical] = useState('');
  const [searchSkills, setSearchSkills] = useState('');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [summary, setSummary] = useState({ profiles: 0, jds: 0, matches: 0 });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');

    axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    axios.get('http://127.0.0.1:5000/recruiter/summary')
      .then((res) => setSummary(res.data))
      .catch(() => {});
  }, [navigate]);

  const handleResumeUpload = (e) => setProfileFile(e.target.files[0]);

  const uploadProfile = async () => {
    if (!empId || !name || !profileFile || !vertical) return alert("Please fill all required fields.");
    const formData = new FormData();
    formData.append('file', profileFile);
    formData.append('emp_id', empId);
    formData.append('name', name);
    formData.append('vertical', vertical);
    formData.append('experience_years', experience);
    try {
      await axios.post('http://127.0.0.1:5000/upload-profile', formData);
      setStatus('✅ Profile uploaded successfully');
    } catch {
      setStatus('❌ Upload failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
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
        },
      });
      setSearchResults(res.data);
    } catch {
      alert('❌ Failed to fetch profiles.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f9f9f9] text-gray-900 font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-6 py-4 font-sans flex justify-between items-center">
  {/* Logo */}
   <h1 className="text-3xl font-bold tracking-tight text-gray-800">
   <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-700 via-black to-gray-700">
    Radar
  </span>
  <span className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow rounded">X</span>
  <span className="text-sm text-grey-300 font-medium ml-2">| Recruiter</span>
  </h1>

  {/* Navigation Buttons with Underline Animation */}
  <nav className="flex gap-6 items-center">
    {[
      { key: 'upload', label: 'Upload Profile' },
      { key: 'resume', label: 'Resume → JD' },
      { key: 'onetoone', label: 'One-to-One' },
      { key: 'jds', label: 'View JDs' },
      { key: 'search', label: 'Search Profiles' }
    ].map((item) => (
      <button
        key={item.key}
        onClick={() => setActiveSection(item.key)}
        className={`relative group inline-block text-sm font-semibold px-2 py-1 transition-all duration-200 ${
          activeSection === item.key
            ? 'text-purple-700'
            : 'text-gray-600 hover:text-purple-700'
        }`}
      >
        {item.label}
        <span
          className={`absolute left-1/2 bottom-0 h-[2px] w-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ${
            activeSection === item.key
              ? 'w-full left-0'
              : 'group-hover:w-full group-hover:-translate-x-1/2'
          }`}
        />
      </button>
    ))}

    <button
      onClick={handleLogout}
      className="text-sm px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-red-100 transition"
    >
      Logout
    </button>
  </nav>
</header>


      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 p-6">
        {[['Profiles', summary.profiles, 'text-purple-600'], ['JDs', summary.jds, 'text-blue-600'], ['Matches', summary.matches, 'text-green-600'], ['Active Users', 23, 'text-rose-500']].map(([label, value, color], idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-white bg-opacity-70 shadow-lg backdrop-blur border border-gray-200">
            <p className="text-sm text-gray-500">{label}</p>
            <h3 className={`text-4xl font-extrabold ${color}`}>{value}</h3>
          </div>
        ))}
      </section>

      <main className="max-w-screen-xl mx-auto px-6 pb-16">
        <AnimatePresence mode="wait">
          {activeSection === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-xl font-semibold text-center tracking-wide mb-4">Upload Consultant Profile</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <input placeholder="Employee ID" value={empId} onChange={(e) => setEmpId(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm" />
                <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm" />
                <select value={vertical} onChange={(e) => setVertical(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm">
                  <option value="">Select Vertical</option>
                  {verticalOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <input placeholder="Experience (Years)" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm" />
              </div>
              <div className="mt-4">
                <label className="block bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium px-6 py-3 rounded-lg cursor-pointer transition">
                  📎 Choose Resume File
                  <input type="file" onChange={handleResumeUpload} className="hidden" />
                </label>
              </div>
              {profileFile && <p className="text-sm text-green-600 mt-2">✅ {profileFile.name}</p>}
              <button onClick={uploadProfile} className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl shadow hover:scale-105 transition">Upload Profile</button>
              {status && <p className="text-sm mt-2 text-gray-700">{status}</p>}
            </motion.div>
          )}

          {activeSection === 'resume' && <motion.div key="resume" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ResumeToJDPage /></motion.div>}
          {activeSection === 'onetoone' && <motion.div key="onetoone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><OneToOneMatchPage /></motion.div>}
          {activeSection === 'jds' && <motion.div key="jds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ViewJDMatches /></motion.div>}

          {activeSection === 'search' && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold text-center tracking-wide">Search Consultant Profiles</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <input placeholder="Name or Emp ID" onChange={(e) => { setSearchName(e.target.value); setSearchEmpId(e.target.value); }} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm" />
                <input placeholder="Skills" onChange={(e) => setSearchSkills(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm" />
                <select onChange={(e) => setSearchVertical(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm">
                  <option value="">Select Vertical</option>
                  {verticalOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <div className="flex gap-2">
                  <input placeholder="Min Exp" type="number" onChange={(e) => setMinExp(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl w-1/2" />
                  <input placeholder="Max Exp" type="number" onChange={(e) => setMaxExp(e.target.value)} className="border border-gray-300 px-4 py-2 rounded-xl w-1/2" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <button onClick={handleSearch} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl shadow hover:scale-105 transition">🔍 Run Search</button>
                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="text-sm text-purple-700 hover:underline">Switch to {viewMode === 'grid' ? 'List' : 'Grid'} View</button>
              </div>
             {searchResults.length > 0 && (
  <SearchResultsCard results={searchResults} viewMode={viewMode} />
)}

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-gray-200 bg-white text-center py-3 text-sm text-gray-500">
        © 2024 RadarX. All rights reserved.
      </footer>
    </div>
  );
}
