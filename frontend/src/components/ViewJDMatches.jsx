import React, { useEffect, useState } from 'react';
import TopMatchCard from '../components/TopMatchCard';
import axios from 'axios';
 
export default function ViewJDMatches() {
  const [jds, setJDs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedJD, setSelectedJD] = useState(null);
  const [topMatches, setTopMatches] = useState([]);
  const [toEmail, setToEmail] = useState('');
  const [ccList, setCcList] = useState('');
 
  // Filters
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
 
  // ✅ Predefined lowercase skills (for robust filtering)
  const skillOptions = [
    "java", "python", "react", "node.js", "aws", "sql", "c++",
    "docker", "kubernetes", "azure", "linux", "mongodb", "html", "css"
  ];
 
  useEffect(() => {
axios.get('http://127.0.0.1:5000/jds/filterable').then(res => setJDs(res.data));
  }, []);
 
  useEffect(() => {
    const emailFromToken = localStorage.getItem('email');
    if (emailFromToken) setToEmail(emailFromToken);
  }, []);
 
  const allStatuses = Array.from(new Set(jds.map(jd => jd.status || '')));
  const allExperiences = Array.from(new Set(jds.map(jd => jd.experience)));
 
  // ✅ Final filter logic
  const filteredJDs = jds.filter(jd => {
    const skillMatch = selectedSkill
      ? jd.skills?.some(skill => skill.toLowerCase() === selectedSkill.toLowerCase())
      : true;
    const expMatch = selectedExperience
      ? jd.experience >= parseInt(selectedExperience)
      : true;
    const statusMatch = selectedStatus ? jd.status === selectedStatus : true;
    const textMatch =
      jd.project_code.toLowerCase().includes(search.toLowerCase()) ||
      jd.uploaded_by?.toLowerCase().includes(search.toLowerCase());
    return skillMatch && expMatch && statusMatch && textMatch;
  });
 
  const fetchMatches = async (jdId) => {
    setSelectedJD(jdId);
const res = await axios.post('http://127.0.0.1:5000/match/jd-to-resumes', {
      jd_id: jdId,
    });
    setTopMatches(res.data.top_matches || []);
  };
 
  const sendEmail = async () => {
    const toEmail = localStorage.getItem('email');
    if (!toEmail || !selectedJD || topMatches.length === 0) return alert('Fill all fields');
    const payload = {
      jd_id: selectedJD,
      to_email: toEmail,
      cc_list: ccList.split(',').map(e => e.trim()).filter(Boolean),
      attachments: topMatches.map(m => m.file_path),
      subject: `Top Matches for JD #${selectedJD}`,
      top_matches: topMatches,
    };
    try {
const res = await axios.post('http://127.0.0.1:5000/send-email/manual', payload);
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert('Email failed');
    }
  };
 
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
 
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Skill Filter */}
        <select
          value={selectedSkill}
          onChange={e => setSelectedSkill(e.target.value)}
          className="bg-[#222] text-white border border-gray-600 rounded px-3 py-2"
        >
          <option value="">All Skills</option>
          {skillOptions.map((skill, idx) => (
            <option key={idx} value={skill}>
              {skill.charAt(0).toUpperCase() + skill.slice(1)}
            </option>
          ))}
        </select>
 
        {/* Experience Filter */}
        <select
          value={selectedExperience}
          onChange={e => setSelectedExperience(e.target.value)}
          className="bg-[#222] text-white border border-gray-600 rounded px-3 py-2"
        >
          <option value="">All Experience</option>
          {allExperiences.map((exp, idx) => (
            <option key={idx} value={exp}>
              {exp}+ years
            </option>
          ))}
        </select>
 
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="bg-[#222] text-white border border-gray-600 rounded px-3 py-2"
        >
          <option value="">All Status</option>
          {allStatuses.map((status, idx) => (
            <option key={idx} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
 
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
JD #{jd.id} — {jd.job_title || '(No Title)'}
            </button>
          ))
        )}
      </div>
 
      {/* Match Results */}
      {topMatches.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-cyan-300">Top Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMatches.map((match, idx) => (
              <TopMatchCard key={idx} match={match} />
            ))}
          </div>
 
          {/* Email Form */}
          <div className="mt-6 space-y-2">
            <input
              type="email"
              value={toEmail}
              readOnly
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded text-gray-400 cursor-not-allowed"
              placeholder="To Email (Auto from Token)"
            />
            <input
              type="text"
              value={ccList}
              onChange={e => setCcList(e.target.value)}
              placeholder="CC (comma-separated)"
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded text-white"
            />
            <div className="flex flex-col md:flex-row gap-4 pt-2">
              <button
                onClick={sendEmail}
                className="w-full md:w-auto bg-accent text-black font-semibold px-6 py-2 rounded hover:bg-cyan-400 transition"
              >
                📧 Send Matches
              </button>
              <a
href={`http://127.0.0.1:5000/generate-pdf/${selectedJD}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                ⬇️ Download PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}