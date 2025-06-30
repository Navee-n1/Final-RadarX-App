import React, { useState } from 'react';
import axios from 'axios';
import MatchCard from '../components/MatchCard';
 
export default function ResumeMatchSection() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
 
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
setResumeFile(file.name);
 
    const formData = new FormData();
    formData.append('file', file);
formData.append('name', file.name);
 
const res = await axios.post('http://127.0.0.1:5000/upload-resume', formData);
    setResumeId(res.data.resume_id);
    setMatches([]);
  };
 
  const runMatch = async () => {
    if (!resumeId) return;
    setLoading(true);
 
const res = await axios.post(
'http://127.0.0.1:5000/match/resume-to-jds',
      { resume_id: resumeId }
    );
 
    // ✅ Remove duplicate JD matches by jd_id or jd_file
    const seen = new Set();
    const uniqueMatches = [];
 
    for (const match of res.data.top_matches) {
      const id = match.jd_id || match.jd_file;
      if (!seen.has(id)) {
        seen.add(id);
        uniqueMatches.push(match);
      }
    }
 
    setMatches(uniqueMatches);
    setLoading(false);
  };
 
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">📄 Resume → JD Matching</h2>
      <div className="space-y-4">
        <label className="block p-4 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg text-center cursor-pointer transition">
          📎 Upload Resume File
          <input type="file" onChange={handleUpload} className="hidden" />
        </label>
        {resumeFile && <p className="text-green-700 text-sm">✅ Uploaded: {resumeFile}</p>}
 
        <button
          onClick={runMatch}
          disabled={!resumeId || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition disabled:opacity-50"
        >
          {loading ? '🔄 Matching...' : '🔍 Match Resume to JDs'}
        </button>
      </div>
 
      {matches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Top JD Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match, i) => (
              <MatchCard key={i} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}