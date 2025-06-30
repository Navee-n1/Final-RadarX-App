import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopMatchCard from '../components/TopMatchCard';
import { FileSearch, Send, Download } from 'lucide-react';

const iconColors = ['text-purple-500', 'text-pink-500', 'text-sky-500'];

export default function ViewJDMatches() {
  const [jds, setJDs] = useState([]);
  const [filteredJDs, setFilteredJDs] = useState([]);
  const [selectedJD, setSelectedJD] = useState(null);
  const [topMatches, setTopMatches] = useState([]);
  const [search, setSearch] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [ccList, setCcList] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/jds/filterable').then(res => {
      setJDs(res.data);
      setFilteredJDs(res.data.slice(0, 3));
    });
    const emailFromToken = localStorage.getItem('email');
    if (emailFromToken) setToEmail(emailFromToken);
  }, []);

  const fetchMatches = async (jdId) => {
    setSelectedJD(jdId);
    const res = await axios.post('http://127.0.0.1:5000/match/jd-to-resumes', { jd_id: jdId });
    setTopMatches(
      res.data.top_matches?.map((m, i) => ({ ...m, rank: i + 1 })) || []
    );
  };

  const filterJDs = () => {
    const result = jds.filter(jd => {
      const skillMatch = selectedSkill
        ? jd.skills?.some(skill => skill.toLowerCase() === selectedSkill.toLowerCase())
        : true;
      const expMatch = selectedExperience
        ? jd.experience >= parseInt(selectedExperience)
        : true;
      const statusMatch = selectedStatus
        ? jd.status === selectedStatus
        : true;
      const textMatch =
        jd.project_code?.toLowerCase().includes(search.toLowerCase()) ||
        jd.uploaded_by?.toLowerCase().includes(search.toLowerCase());
      return skillMatch && expMatch && statusMatch && textMatch;
    });
    setFilteredJDs(result.slice(0, 3));
  };

  const sendEmail = async () => {
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
    } catch {
      alert('Email failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-pink-100 text-pink-700';
      case 'In Review': return 'bg-sky-100 text-sky-700';
      case 'Completed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 min-h-screen text-gray-800">
      <h2 className="text-3xl font-bold mb-6 flex items-center justify-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-sky-500 to-purple-600">
        <FileSearch size={28} /> View & Match JDs
      </h2>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        {['Pending', 'In Review', 'Completed', 'Others'].map(status => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <span className={`w-4 h-4 rounded-full border ${getStatusColor(status)}`}></span>
            <span className="text-gray-600">{status}</span>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search by Project Code or Uploader"
        className="mb-6 w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm"
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyUp={filterJDs}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <select
          value={selectedSkill}
          onChange={(e) => { setSelectedSkill(e.target.value); filterJDs(); }}
          className="px-4 py-3 rounded-xl border border-gray-300"
        >
          <option value="">All Skills</option>
          {['react', 'node.js', 'python', 'java', 'sql', 'aws', 'docker'].map(skill => (
            <option key={skill} value={skill}>{skill.toUpperCase()}</option>
          ))}
        </select>

        <select
          value={selectedExperience}
          onChange={(e) => { setSelectedExperience(e.target.value); filterJDs(); }}
          className="px-4 py-3 rounded-xl border border-gray-300"
        >
          <option value="">All Experience</option>
          {[1, 2, 3, 5, 7].map(years => (
            <option key={years} value={years}>{years}+ Years</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); filterJDs(); }}
          className="px-4 py-3 rounded-xl border border-gray-300"
        >
          <option value="">All Status</option>
          {['Pending', 'In Review', 'Completed'].map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-4 col-span-1 max-h-[80vh] overflow-y-auto pr-2">
          {filteredJDs.length === 0 ? (
            <p className="text-gray-500">No matching JDs found.</p>
          ) : (
            filteredJDs.map(jd => (
              <div
                key={jd.id}
                onClick={() => fetchMatches(jd.id)}
                className={`p-4 border rounded-xl shadow cursor-pointer transition-all hover:shadow-lg ${
                  selectedJD === jd.id ? 'border-purple-500 bg-purple-50' : 'bg-white border-gray-300'
                }`}
              >
                <h3 className="text-lg font-semibold mb-1">JD #{jd.id} — {jd.job_title || 'Untitled Role'}</h3>
                <p className="text-sm text-gray-600 mb-1">Project Code: <span className="font-medium">{jd.project_code}</span></p>
                <p className="text-sm text-gray-600 mb-1">Uploaded By: <span className="font-medium">{jd.uploaded_by}</span></p>
                {jd.project_domain && (
                  <p className="text-sm text-gray-500 mb-1">Domain: <span className="font-medium">{jd.project_domain}</span></p>
                )}
                {jd.status && (
                  <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(jd.status)}`}>
                    {jd.status}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="col-span-2 space-y-6">
          {topMatches.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {topMatches.slice(0, 3).map((match, idx) => (
                  <TopMatchCard key={idx} match={{ ...match, rank: idx + 1, iconColor: iconColors[idx % iconColors.length] }} />
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <input
                  type="email"
                  value={toEmail}
                  readOnly
                  className="w-full px-4 py-3 border rounded-lg text-gray-500 bg-gray-100"
                  placeholder="To Email (Auto)"
                />
                <input
                  type="text"
                  value={ccList}
                  onChange={e => setCcList(e.target.value)}
                  placeholder="CC (comma-separated)"
                  className="w-full px-4 py-3 border rounded-lg"
                />

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={sendEmail}
                    className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-purple-500 hover:from-sky-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow"
                  >
                    <Send size={18} /> Send Matches
                  </button>

                  <a
                    href={`http://127.0.0.1:5000/generate-pdf/${selectedJD}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow"
                  >
                    <Download size={18} /> Download PDF
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
