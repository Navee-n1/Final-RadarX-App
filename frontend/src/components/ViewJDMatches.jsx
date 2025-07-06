import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Send, Download, FileSearch } from 'lucide-react';
import TopMatchCard from '../components/TopMatchCard';
import EmailModal from '../components/EmailModal';

export default function ViewJDMatches() {
  const [jds, setJDs] = useState([]);
  const [filteredJDs, setFilteredJDs] = useState([]);
  const [selectedJD, setSelectedJD] = useState(null);
  const [matches, setMatches] = useState([]);
  const [toEmail, setToEmail] = useState('');
  const [ccList, setCcList] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Filters
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/jds/filterable').then(res => {
      setJDs(res.data);
      setFilteredJDs(res.data);
    });
    const email = localStorage.getItem('email');
    if (email) setToEmail(email);
  }, []);

  const fetchMatches = async (jdId) => {
    setSelectedJD(jds.find(jd => jd.id === jdId));
      try {
    const res = await axios.post('http://127.0.0.1:5000/match/jd-to-resumes', {
          jd_id: jdId
        });
        setMatches(res.data.top_matches || []);
      } catch (err) {
        alert('Failed to fetch matches');
      }
    };

    const filterJDs = (skill, experience, status) => {
      let result = [...jds]; // always start from original list
     
      if (skill) {
        result = result.filter(jd =>
          jd.skills?.some(s => s.toLowerCase() === skill.toLowerCase())
        );
      }
     
      if (experience) {
        result = result.filter(jd =>
          jd.experience >= parseInt(experience)
        );
      }
     
      if (status) {
        result = result.filter(jd => jd.status === status);
      }
     
      setFilteredJDs(result);
    };

  const sendEmail = async () => {
    if (!toEmail || !selectedJD || matches.length === 0)
      return alert('Missing fields');
    const payload = {
      jd_id: selectedJD.id,
      to_email: toEmail,
      cc_list: ccList.split(',').map(s => s.trim()).filter(Boolean),
      attachments: matches.map(m => m.resume_path || m.file_path),
      subject: `Top Matches for JD #${selectedJD.id}`,
      top_matches: matches,
    };
    try {
      const res = await axios.post('http://127.0.0.1:5000/send-email/matches-final', payload);
      alert(res.data.message);
    } catch {
      alert('Email failed');
    }
  };

  const getCardStyle = (jd) => {
    const isSelected = selectedJD?.id === jd.id;
      return `
        p-4 rounded-xl border shadow-sm cursor-pointer transition-all duration-300
        ${isSelected ? 'border-purple-500 bg-purple-50 scale-[1.02]' : 'bg-white border-gray-300'}
        hover:scale-[1.05] hover:shadow-xl hover:bg-purple-100
      `;
    };

  return (
    <div className="p-6 text-gray-800 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 flex gap-2 justify-center items-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-sky-500 to-purple-600">
        <FileSearch size={28} /> JD Match Dashboard
      </h2>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
      <select
  value={selectedSkill}
  onChange={e => {
    const value = e.target.value;
    setSelectedSkill(value);
    filterJDs(value, selectedExperience, selectedStatus);
  }}
  className="px-4 py-2 rounded-lg border border-gray-300"
>
  <option value="">All Skills</option>
  {['react', 'node.js', 'python', 'java', 'sql', 'aws', 'docker'].map(skill => (
    <option key={skill} value={skill}>{skill.toUpperCase()}</option>
  ))}
</select>

<select
  value={selectedExperience}
  onChange={e => {
    const value = e.target.value;
    setSelectedExperience(value);
    filterJDs(selectedSkill, value, selectedStatus);
  }}
  className="px-4 py-2 rounded-lg border border-gray-300"
>
  <option value="">All Experience</option>
  {[1, 2, 3, 5, 7].map(years => (
    <option key={years} value={years}>{years}+ Years</option>
  ))}
</select>

<select
  value={selectedStatus}
  onChange={e => {
    const value = e.target.value;
    setSelectedStatus(value);
    filterJDs(selectedSkill, selectedExperience, value);
  }}
  className="px-4 py-2 rounded-lg border border-gray-300"
>
  <option value="">All Status</option>
  {['Pending', 'Review', 'Completed'].map(status => (
    <option key={status} value={status}>{status}</option>
  ))}
</select>
      </div>

      {/* JD Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {filteredJDs.map(jd => (
          <div
            key={jd.id}
            onClick={() => fetchMatches(jd.id)}
            className={getCardStyle(jd)}
          >
            JD #{jd.id} — {jd.job_title}
            <p className="text-xs text-gray-500">Project Code: {jd.project_code}</p>
            <p className="text-xs text-gray-500">Uploader: {jd.uploaded_by}</p>
          </div>
        ))}
      </div>

      {/* Matches */}
      {selectedJD && matches.length > 0 && (
        <div className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
          {matches.slice(0, 3).map((match, i) => (
  <TopMatchCard
    key={i}
    match={{
      ...match,
      rank: i + 1,
      jd_title: selectedJD?.job_title,
      jd_id: selectedJD?.id,
      from_email: toEmail  // recruiter's email
    }}
  />
))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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
              onClick={() => setShowEmailModal(true)}
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

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal
          toEmail={toEmail}
          cc={ccList}
          setCc={setCcList}
          onSend={sendEmail}
          onClose={() => setShowEmailModal(false)}
          hasStrongMatch={matches.length > 0}
        />
      )}
    </div>
  );
}
