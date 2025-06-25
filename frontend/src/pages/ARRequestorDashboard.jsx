import React, { useState } from 'react';
import axios from 'axios';
import ResumeMatchSection from '../components/ResumeMatchSection';
import OneToOneMatchSection from '../components/OneToOneMatchSection';
import LiveTracker from '../components/LiveTracker';
import TopMatchCard from '../components/TopMatchCard';
import EmailModal from '../components/EmailModal';

export default function ARRequestorDashboard({ onLogout }) {
  const [activeSection, setActiveSection] = useState('upload');
  const [jdFile, setJdFile] = useState(null);
  const [jdId, setJdId] = useState(null);
  const [jdTitle, setJdTitle] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({
    compared: false,
    ranked: false,
    emailed: false,
  });
  const [topMatches, setTopMatches] = useState([]);
  const [cc, setCc] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const userEmail = localStorage.getItem('email');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setJdFile(file);
    setJdTitle(file?.name.replace(/\.[^/.]+$/, '') || 'HEX-JD-BULK');
  };

  const uploadJD = async () => {
    if (!jdFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', jdFile);
    formData.append('uploaded_by', userEmail || 'ar@hexaware.com');
    formData.append('project_code', jdTitle);
    try {
      const res = await axios.post('http://127.0.0.1:5000/upload-jd', formData);
      const newJdId = res.data.jd_id;
      setJdId(newJdId);
      setProgress((p) => ({ ...p, compared: true }));
      runMatching(newJdId);
    } catch (err) {
      alert('❌ JD upload failed');
    }
  };

  const runMatching = async (jdId) => {
    try {
      const res = await axios.post('http://127.0.0.1:5000/match/jd-to-resumes', { jd_id: jdId });
      if (res.data.top_matches?.length) {
        setTopMatches(res.data.top_matches);
        setProgress((p) => ({ ...p, ranked: true, emailed: true }));
      } else {
        alert('⚠️ No matches found.');
      }
    } catch (err) {
      alert('❌ Matching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:5000/send-email/manual', {
        jd_id: jdId,
        to_email: userEmail,
        cc_list: cc.split(',').map((e) => e.trim()).filter(Boolean),
        attachments: topMatches.map((m) => m.file_path),
        subject: `Top Matches for ${jdTitle}`,
        body: `Hello,\n\nPlease find the top consultant matches for JD "${jdTitle}".\n\nRegards,\nRadarX AI`,
      });
      alert(res.data.message);
      setEmailSent(true);
      setShowEmailModal(false);
    } catch (err) {
      console.error('Email failed:', err);
      alert('❌ Failed to send email.');
    }
  };

  const resetUpload = () => {
    setJdId(null);
    setJdFile(null);
    setTopMatches([]);
    setEmailSent(false);
    setProgress({ compared: false, ranked: false, emailed: false });
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans relative overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white/10 shadow-md">
        <h1 className="text-xl font-bold text-cyan-400 tracking-wide">🚀 RadarX – AR Dashboard</h1>
        <div className="flex gap-4 items-center">
          {['upload', 'resume', 'onetoone'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className={`relative group px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeSection === tab
                  ? 'bg-cyan-400 text-black shadow-lg'
                  : 'bg-white/10 hover:bg-cyan-500/20 text-white'
              }`}
            >
              {tab === 'upload' ? '📤 Upload JD' : tab === 'resume' ? '🔄 Resume → JD' : '🔗 One-to-One'}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300" />
            </button>
          ))}
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-xl mx-auto px-6 py-10 space-y-12">
        {activeSection === 'upload' && (
          <>
            {!jdId ? (
              <div className="bg-white/5 border border-white/20 p-10 rounded-2xl shadow-xl max-w-2xl mx-auto text-center backdrop-blur-lg">
                <h2 className="text-2xl font-bold text-cyan-300 mb-3">Upload Job Description</h2>
                <label className="block bg-gray-800 hover:bg-gray-700 border border-cyan-800 text-white font-medium px-6 py-4 rounded-xl cursor-pointer transition-all duration-200">
                  📎 Choose JD File
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
                {jdFile && <p className="text-sm text-green-400 mt-2">✅ {jdFile.name}</p>}
                <button
                  onClick={uploadJD}
                  disabled={!jdFile || loading}
                  className="mt-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black px-6 py-3 rounded-lg font-bold shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : '🔍 Start AI Matching'}
                </button>
              </div>
            ) : (
              <>
                <LiveTracker
                  jdId={jdId}
                  progress={progress}
                  topMatches={topMatches}
                  emailSent={emailSent}
                />

                {!emailSent && (
  <div className="flex justify-center gap-4 mt-8">
    <button
      onClick={resetUpload}
      className="bg-black border border-cyan-500 text-cyan-300 font-semibold px-5 py-2 rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
    >
      🔁 Upload New JD
    </button>

    <button
      onClick={() => setShowEmailModal(true)}
      className="bg-black border border-green-400 text-green-300 font-semibold px-5 py-2 rounded-xl shadow-lg hover:shadow-green-500/50 transition-all duration-300"
    >
      📩 Send Email
    </button>
  </div>
)}


                {topMatches.length > 0 && (
                  <div className="mt-10 space-y-6">
                    <h3 className="text-2xl font-bold text-center text-cyan-300 mb-4">Top 3 Consultant Matches</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {topMatches.map((match, i) => (
                        <TopMatchCard key={i} match={match} />
                      ))}
                    </div>
                  </div>
                )}

                
              </>
            )}
          </>
        )}

        {activeSection === 'resume' && (
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-xl">
            <ResumeMatchSection />
          </div>
        )}

        {activeSection === 'onetoone' && (
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-xl">
            <OneToOneMatchSection />
          </div>
        )}
      </main>

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal
          toEmail={userEmail}
          cc={cc}
          setCc={setCc}
          onSend={handleSendEmail}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
