import React, { useState } from 'react';
import axios from 'axios';

const OneToOneMatchSection = () => {
  const [jdText, setJdText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    if (!jdText || !resumeFile) return alert('Please provide JD text and upload a resume');

    const formData = new FormData();
    formData.append('resume_file', resumeFile);
    formData.append('jd_text', jdText);

    try {
      setLoading(true);
      const res = await axios.post('http://127.0.0.1:5000/match/one-to-one', formData, {
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
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Enter Job Description</h3>
        <textarea
          rows={6}
          placeholder="Paste JD content here..."
          className="w-full p-4 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />

        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Upload Resume File</h3>
        <label className="block p-4 text-center bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-medium rounded-lg cursor-pointer transition">
          📎 Choose Resume
          <input type="file" onChange={(e) => setResumeFile(e.target.files[0])} className="hidden" />
        </label>
        {resumeFile && <p className="mt-2 text-sm text-green-600">✅ {resumeFile.name}</p>}

        <button
          onClick={handleMatch}
          disabled={loading || !jdText || !resumeFile}
          className="mt-6 w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 rounded-md transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : '🔍 Match Resume to JD'}
        </button>
      </div>

      {/* Match Results */}
      {matchResult && (
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Match Results</h3>
          <p className="text-gray-700 mb-2">
            <strong>Similarity Score:</strong> {(matchResult.similarity * 100).toFixed(2)}%
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Matching Skills:</strong> {matchResult.overlap_skills?.join(', ') || 'None'}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Missing Skills:</strong> {matchResult.missing_skills?.join(', ') || 'None'}
          </p>
          <p className="text-gray-600 italic">
            <strong>Recommendation:</strong> {matchResult.recommendation || 'N/A'}
          </p>
        </div>
      )}
    </div>
  );
};

export default OneToOneMatchSection;
