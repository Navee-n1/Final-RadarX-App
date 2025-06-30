import React, { useState } from 'react'
import axios from 'axios'
 
export default function OneToOneMatchSection() {
  const [jdFile, setJdFile] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [jdId, setJdId] = useState(null)
  const [resumeId, setResumeId] = useState(null)
  const [result, setResult] = useState(null)
 
  const uploadJD = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setJdFile(file.name)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('uploaded_by', 'recruiter@hexaware.com')
    formData.append('project_code', '1-1-MATCH')
    const res = await axios.post('http://127.0.0.1:5000/upload-jd', formData)
    setJdId(res.data.jd_id)
  }
 
  const uploadResume = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResumeFile(file.name)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)
    const res = await axios.post('http://127.0.0.1:5000/upload-resume', formData)
    setResumeId(res.data.resume_id)
  }
 
  const runOneToOne = async () => {
    const res = await axios.post('http://127.0.0.1:5000/match/one-to-one', {
      jd_id: jdId,
      resume_id: resumeId
    })
    setResult(res.data)
    console.log("One to one match result: ",res.data)
  }
 
  return (
    <div className="bg-[#1a1a1a] mt-10 p-6 rounded-2xl shadow-lg border border-gray-800">
      <h2 className="text-lg font-semibold mb-4 text-accent">One-to-One JD ↔ Resume Match</h2>
 
      <div className="space-y-4">
        <div className="relative w-full">
  <label className="bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded cursor-pointer inline-block w-full text-center hover:bg-gray-700 transition">
    📎 Choose JD File
    <input type="file" onChange={uploadJD} className="hidden" />
  </label>
  {jdFile && <p className="text-sm text-green-400 mt-2">✅Uploaded: {jdFile}</p>}
</div>
 
       
 
       <div className="relative w-full">
  <label className="bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded cursor-pointer inline-block w-full text-center hover:bg-gray-700 transition">
    📎 Choose Resume File
    <input type="file" onChange={uploadResume} className="hidden" />
  </label>
  {resumeFile && <p className="text-sm text-green-400 mt-2">✅Uploaded: {resumeFile}</p>}
</div>
 
 
        <button
          disabled={!jdId || !resumeId}
          onClick={runOneToOne}
          className="bg-accent text-black font-semibold py-2 px-6 rounded-lg shadow-md disabled:opacity-30"
        >
          🔍 Compare JD & Resume
        </button>
      </div>
 
      {result && (
        <div className="mt-6 bg-[#222] p-5 rounded-xl text-sm text-gray-200">
          <p><strong>Match Score:</strong> {result.score}</p>
          <p><strong>Label:</strong> {result.label}</p>
          <div className="mt-3">
            <p><strong>Skills Matched:</strong> {result.explanation.skills_matched.join(', ')}</p>
            <p><strong>Missing Skills:</strong> {result.explanation.skills_missing.join(', ')}</p>
            <p><strong>JD Role:</strong> {result.explanation.jd_role}</p>
            <p><strong>Resume Role:</strong> {result.explanation.resume_role}</p>
            <p><strong>Experience:</strong> {result.explanation.resume_experience_found || '-'} (required: {result.explanation.jd_experience_required})</p>
            {result.explanation.resume_highlights?.length > 0 && (
            <>
              <p className="mt-2"><strong>Highlights:</strong></p>
              <ul className="list-disc ml-5">
                {result.explanation.resume_highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </>
          )}
          </div>
        </div>
      )}
    </div>
  )
}
 