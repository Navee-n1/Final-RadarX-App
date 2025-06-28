import React, { useState,useEffect,useCallback } from 'react';
import axios from 'axios';
import LiveTracker from '../components/LiveTracker';
import TopMatchCard from '../components/TopMatchCard';
import EmailModal from '../components/EmailModal';
import { useNavigate } from 'react-router-dom';
import ARDashboardLayout from '../layouts/ARDashboardLayout';
import { Send, Rocket, RefreshCw } from 'lucide-react';
import { UploadCloud } from 'lucide-react';

export default function UploadJDPage() {
  const [jdFile, setJdFile] = useState(null);
  const [jdId, setJdId] = useState(null);
  const [jdTitle, setJdTitle] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ compared: false, ranked: false, emailed: false });
  const [topMatches, setTopMatches] = useState([]);
  const [cc, setCc] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const userEmail = localStorage.getItem('email');
  const navigate = useNavigate();

  const axiosAuth = axios.create({
    baseURL: 'http://127.0.0.1:5000',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

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
    formData.append('job_title', jobTitle);
    formData.append('uploaded_by', userEmail || 'ar@hexaware.com');
    formData.append('project_code', jdTitle);
    try {
      const res = await axiosAuth.post('/upload-jd', formData);
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
      const res = await axiosAuth.post('/match/jd-to-resumes', { jd_id: jdId });
      if (res.data.top_matches?.length) {
        setTopMatches(res.data.top_matches);
        setProgress((p) => ({ ...p, ranked: true }));
      } else {
        alert('⚠️ No matches found.');
      }
    } catch (err) {
      if (err?.response?.status === 401) navigate('/');
      alert('❌ Matching failed');
    } finally {
      setLoading(false);
    }
  };
  


const handleSendEmail = useCallback(async () => {
  const goodMatches = topMatches.filter((m) => m.score >= 0.5);
  try {
    const res = await axiosAuth.post('/send-email/manual', {
      jd_id: jdId,
      to_email: userEmail,
      cc_list: cc.split(',').map((e) => e.trim()).filter(Boolean),
      attachments: goodMatches.map((m) => m.resume_path || m.file_path || ''),
      subject: `Top Matches for ${jobTitle}`,
      top_matches: goodMatches,
    });

    alert(res.data.message);
    setEmailSent(true);
  
setProgress((p) => ({ ...p, emailed: true }));
    setShowEmailModal(false);
  } catch (err) {
    if (err?.response?.status === 401) navigate('/');
    console.error('❌ Auto Email Error:', err.response?.data?.error || err.message);
  }
}, [axiosAuth, jdId, userEmail, cc, topMatches, jobTitle, navigate]);


  const resetUpload = () => {
    setJdId(null);
    setJdFile(null);
    setTopMatches([]);
    setEmailSent(false);
    setProgress({ compared: false, ranked: false, emailed: false });
  };

useEffect(() => {
  if (!emailSent && topMatches.length > 0) {
    const allBelowThreshold = topMatches.every((m) => m.score < 0.5);
    if (allBelowThreshold) {
      console.log('📤 Auto-sending "no good matches" email...');
      handleSendEmail();
    } else {
      console.log('🟢 Found at least one match ≥ 50%. Showing manual send option.');
    }
  }
}, [topMatches, emailSent, handleSendEmail]);



  return (
    <ARDashboardLayout>
      <div className="text-gray-800">
        {!jdId ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
  {/* Gradient Title with Icon */}
  <h2 className="text-3xl font-extrabold tracking-tight relative inline-block">
    <span className="relative z-10 flex items-center justify-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500 animate-gradient-x">
      <UploadCloud size={34} className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
      Upload Job Description
    </span>
  </h2>

  {/* Input Fields */}
  <div className="w-full max-w-md space-y-4 text-left">
    <input
      type="text"
      value={jobTitle}
      onChange={(e) => setJobTitle(e.target.value)}
      placeholder="Enter Job Title (e.g., Frontend Developer)"
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
    />

    <label className="block bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-medium px-6 py-4 rounded-xl cursor-pointer transition-all text-center">
      Choose JD File
      <input type="file" className="hidden" onChange={handleFileChange} />
    </label>

    {jdFile && (
      <p className="text-sm text-green-600 font-medium">
        Selected: <span className="text-gray-800">{jdFile.name}</span>
      </p>
    )}
  </div>

  {/* Start Matching Button */}
    <button
              onClick={uploadJD}
              disabled={!jdFile || loading}
               className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Rocket className="animate-spin-slow" size={18} />
                  Matching...
                </>
              ) : (
                <>
                  <Rocket size={18} />
                  Start AI Matching
                </>
              )}
            </button>
</div>

        ) : (
          <>
            
            <LiveTracker jobTitle={jobTitle} progress={progress} topMatches={topMatches} emailSent={emailSent} />
<div className="flex justify-center gap-6 mt-10">
  
{!emailSent && topMatches.some(m => m.score >= 0.5) && (
  <button
    onClick={() => setShowEmailModal(true)}
    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
  >
    <Send size={18} />
    Send Email
  </button>
)}

</div>
           

            {topMatches.length > 0 && (
              <div className="mt-10 space-y-6">
                <h3 className="mt-12 text-2xl font-extrabold text-center tracking-tight text-gray-900 flex items-center justify-center gap-3">🏅
 <span className="relative z-10 flex items-center justify-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-pink-500 to-yellow-500 animate-gradient-x">
       TOP 3 CONSULTANTS
    </span>
</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topMatches.map((match, i) => (
                    <TopMatchCard key={i} match={{ ...match, rank: i + 1 }} />
                  ))}
                </div><div className="flex justify-center mt-10">
    <button
      onClick={resetUpload}
      className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
    >
      <RefreshCw size={18} className="animate-spin-slow" />
      Upload New JD
    </button>
  </div>
</div>
                
        
              
              
            )}
          </>
          
        )}

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
    </ARDashboardLayout>
  );
}
