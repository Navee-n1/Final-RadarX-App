import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Send, Download, FileSearch } from 'lucide-react';

export default function ViewJDMatches() {
  const [jds, setJDs] = useState([]);
  const [selectedJD, setSelectedJD] = useState(null);
  const [matches, setMatches] = useState([]);
  const [toEmail, setToEmail] = useState('');
  const [ccList, setCcList] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/jds/filterable')
.then(res => setJDs(res.data));
    const email = localStorage.getItem('email');
    if (email) setToEmail(email);
  }, []);

  const fetchMatches = async (jdId) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/jd/${jdId}/matches`);
      setMatches(res.data.matches);
      setSelectedJD(res.data.jd);
    } catch (err) {
      alert('Failed to fetch matches');
    }
  };

  const sendEmail = async () => {
    if (!toEmail || !selectedJD || matches.length === 0) return alert('Missing fields');
    const payload = {
      jd_id: selectedJD.id,
      to_email: toEmail,
      cc_list: ccList.split(',').map(s => s.trim()).filter(Boolean),
      attachments: matches.map(m => m.resume_path),
      subject: `Top Matches for JD #${selectedJD.id}`,
      top_matches: matches
    };
    try {
      const res = await axios.post('http://127.0.0.1:5000/send-email/manual', payload);
      alert(res.data.message);
    } catch {
      alert('Email failed');
    }
  };

  return (
    <div className="p-6 text-gray-800 min-h-screen">
      <h2 className="text-3xl font-bold mb-4 flex gap-2 justify-center items-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-sky-500 to-purple-600">
        <FileSearch size={28} /> JD Match Dashboard
      </h2>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {jds.map(jd => (
          <div
            key={jd.id}
            onClick={() => fetchMatches(jd.id)}
            className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-lg ${selectedJD?.id === jd.id ? 'border-purple-500 bg-purple-50' : 'bg-white border-gray-300'}`}
          >
            <p className="font-semibold text-sm text-gray-700">JD #{jd.id} — {jd.job_title}</p>
            <p className="text-xs text-gray-500">Project Code: {jd.project_code}</p>
            <p className="text-xs text-gray-500">Uploader: {jd.uploaded_by}</p>
          </div>
        ))}
      </div>

      {selectedJD && matches.length > 0 && (
        <div className="mt-6">
          <div className="overflow-x-auto rounded-xl border shadow">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Emp ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Vertical</th>
                  <th className="px-4 py-3 text-left">Experience</th>
                  <th className="px-4 py-3 text-left">Skills</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => (
                  <tr key={i} className="even:bg-gray-50">
                    <td className="px-4 py-2 font-medium">#{i + 1}</td>
                    <td className="px-4 py-2">{m.emp_id}</td>
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2">{m.vertical}</td>
                    <td className="px-4 py-2">{m.experience_years} yrs</td>
                    <td className="px-4 py-2">{m.skills.join(', ')}</td>
                    <td className="px-4 py-2 font-semibold text-purple-600">{m.score.toFixed(2)}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 max-w-sm">{m.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <input
              type="email"
              value={toEmail}
              readOnly
              className="w-full px-4 py-3 border bg-gray-100 text-gray-600 rounded-xl"
              placeholder="To Email"
            />
            <input
              type="text"
              value={ccList}
              onChange={e => setCcList(e.target.value)}
              placeholder="CC List (comma-separated)"
              className="w-full px-4 py-3 border rounded-xl"
            />

            <button
              onClick={sendEmail}
              className="flex items-center justify-center gap-2 col-span-2 mt-2 bg-gradient-to-r from-sky-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow hover:from-sky-600 hover:to-purple-600"
            >
              <Send size={18} /> Send Matches
            </button>

            <a
              href={`http://127.0.0.1:5000/generate-pdf/${selectedJD.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 col-span-2 mt-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow hover:from-pink-600 hover:to-purple-700"
            >
              <Download size={18} /> Download PDF Report
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
