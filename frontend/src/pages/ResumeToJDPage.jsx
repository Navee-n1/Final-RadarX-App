import React, { useState } from 'react';
import axios from 'axios';
import MatchCard from '../components/MatchCard';
import { UserSearch, UploadCloud, LoaderCircle } from 'lucide-react';

export default function ResumeMatchSection() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

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
    <div className="flex flex-col items-center px-4 py-16 text-gray-800">
      <div className="text-center space-y-6 mb-10">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute animate-ping-slow inline-flex h-16 w-16 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-30 blur-2xl"></div>
          <div className="animate-pulse rounded-full p-4 bg-gradient-to-br from-purple-100 to-purple-200 shadow-inner">
            <UserSearch size={35} className="text-purple-600 drop-shadow-[0_0_10px_rgba(147,51,234,0.6)]" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500 animate-gradient-x">
          Resume → JD Matching
        </h1>
      </div>

      <div className="w-full max-w-xl space-y-4">
        <label className="block bg-white-200 hover:bg-purple-100 border border-purple-300 text-gray-700 font-medium px-6 py-4 rounded-xl cursor-pointer text-center transition-all">
          <UploadCloud className="inline-block mr-2 mb-1 text-purple-500" size={20} />
          Upload Resume File
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
        {resumeFile && <p className="text-sm text-center text-purple-700">✅ {resumeFile}</p>}

        <button
          onClick={runMatch}
          disabled={!resumeId || loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
        >
          {loading ? (
            <>
              <LoaderCircle className="animate-spin-slow" size={18} />
              Matching...
            </>
          ) : (
            <>
              <UserSearch size={18} />
              Match Resume to JDs
            </>
          )}
        </button>
      </div>

      {matches.length > 0 && (
        <div className="mt-16 w-full max-w-5xl">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center tracking-tight">
            🏆 Top JD Matches
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match, i) => (
  <MatchCard key={i} match={match} />
))}

          </div>
        </div>
      )}
    </div>
  );
}
