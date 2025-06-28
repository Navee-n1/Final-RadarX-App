import React, { useState } from 'react';
import axios from 'axios';

const ResumeMatchSection = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    if (!resumeFile || (!jdFile && !jdText)) {
      return alert('Please upload a resume and either attach a JD file or enter JD text.');
    }

    const formData = new FormData();
    formData.append('resume_file', resumeFile);
    if (jdFile) formData.append('jd_file', jdFile);
    if (jdText) formData.append('jd_text', jdText);

    try {
      setLoading(true);
      const res = await axios.post('http://127.0.0.1:5000/match/resume-to-jd', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMatchResult(res.data);
    } catch (err) {
      console.error(err);
      alert('❌ Matching failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 text-gray-800">
      {/* Upload Section */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Upload Resume File</h3>
        <label className="block w-full text-center bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-md p-4 cursor-pointer transition">
          📎 Choose Resume File
          <input type="file" onChange={(e) => setResumeFile(e.target.files[0])} className="hidden" />
        </label>
        {resumeFile && <p className="mt-2 text-sm text-green-600">✅ {resumeFile.name}</p>}

        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Attach JD File or Paste Text</h3>
        <label className="block w-full text-center bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-md p-4 cursor-pointer transition">
          📎 Choose JD File
          <input type="file" onChange={(e) => setJdFile(e.target.files[0])} className="hidden" />
        </label>
        {jdFile && <p className="mt-2 text-sm text-green-600">✅ {jdFile.name}</p>}

        <textarea
          rows={5}
          placeholder="Or paste JD text here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          className="w-full mt-4 p-4 border border-gray-300 rounded-md text-sm bg-white placeholder:text-gray-400 focus:outline-sky-500"
        />

        <button
          onClick={handleMatch}
          disabled={loading || !resumeFile || (!jdFile && !jdText)}
          className="mt-6 w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 rounded-md shadow-sm transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : '🔍 Match Resume to JD'}
        </button>
      </div>

      {/* Match Result */}
      {matchResult && (
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Match Results</h3>
          <p className="text-base text-gray-700 mb-2">
            <strong>Similarity Score:</strong> {(matchResult.similarity * 100).toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Matching Skills:</strong> {matchResult.overlap_skills.join(', ') || 'None'}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Missing Skills:</strong> {matchResult.missing_skills.join(', ') || 'None'}
          </p>
          <p className="text-sm text-gray-600 italic">
            <strong>Recommendation:</strong> {matchResult.recommendation || 'N/A'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResumeMatchSection;
