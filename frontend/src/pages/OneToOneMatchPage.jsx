import React, { useState } from 'react';
import axios from 'axios';
 
export default function OneToOneMatchPage() {
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [jdId, setJdId] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [result, setResult] = useState(null);
 
  const uploadJD = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
setJdFile(file.name);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by', 'recruiter@hexaware.com');
    formData.append('project_code', '1-1-MATCH');
const res = await axios.post('http://127.0.0.1:5000/upload-jd', formData);
    setJdId(res.data.jd_id);
  };
 
  const uploadResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
setResumeFile(file.name);
    const formData = new FormData();
    formData.append('file', file);
formData.append('name', file.name);
const res = await axios.post('http://127.0.0.1:5000/upload-resume', formData);
    setResumeId(res.data.resume_id);
  };
 
  const runOneToOne = async () => {
const res = await axios.post('http://127.0.0.1:5000/match/one-to-one', {
      jd_id: jdId,
      resume_id: resumeId,
    });
    setResult(res.data);
    console.log("One to one match result: ", res.data);
  };
 
  return (
    <div className="max-w-3xl mx-auto space-y-10 text-gray-800 mt-10">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">🔗 JD ↔ Resume One-to-One Match</h3>
 
        {/* Upload JD */}
        <label className="block text-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 font-medium rounded-lg cursor-pointer transition">
          📄 Upload JD File
          <input type="file" onChange={uploadJD} className="hidden" />
        </label>
        {jdFile && <p className="mt-2 text-sm text-blue-700">✅ {jdFile}</p>}
 
        {/* Upload Resume */}
        <label className="block text-center p-4 mt-4 bg-green-50 hover:bg-green-100 border border-green-300 text-green-800 font-medium rounded-lg cursor-pointer transition">
          📎 Upload Resume File
          <input type="file" onChange={uploadResume} className="hidden" />
        </label>
        {resumeFile && <p className="mt-2 text-sm text-green-700">✅ {resumeFile}</p>}
 
        {/* Match Button */}
        <button
          onClick={runOneToOne}
          disabled={!jdId || !resumeId}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-md transition disabled:opacity-50"
        >
          {(!jdId || !resumeId) ? 'Upload both files to match' : '🔍 Compare JD & Resume'}
        </button>
      </div>
 
      {/* Match Results */}
      {result && (
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Match Results</h3>
          <p className="text-gray-700 mb-2">
            <strong>Match Score:</strong> {result.score}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Label:</strong> {result.label}
          </p>
 
          <div className="mt-4">
            <p className="text-gray-700"><strong>Skills Matched:</strong> {result.explanation.skills_matched.join(', ') || '-'}</p>
            <p className="text-gray-700"><strong>Missing Skills:</strong> {result.explanation.skills_missing.join(', ') || '-'}</p>
            <p className="text-gray-700"><strong>JD Role:</strong> {result.explanation.jd_role}</p>
            <p className="text-gray-700"><strong>Resume Role:</strong> {result.explanation.resume_role}</p>
            <p className="text-gray-700"><strong>Experience:</strong> {result.explanation.resume_experience_found || '-'} (required: {result.explanation.jd_experience_required})</p>
 
            {result.explanation.resume_highlights?.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-700 font-semibold">Highlights:</p>
                <ul className="list-disc ml-5 text-gray-600 text-sm mt-2">
                  {result.explanation.resume_highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}