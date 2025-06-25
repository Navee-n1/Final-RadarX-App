import React, { useState } from 'react';
import { Plus, Minus, Send, X } from 'lucide-react';

export default function EmailModal({ toEmail, cc, setCc, onSend, onClose }) {
  const [newCc, setNewCc] = useState('');
  const ccArray = cc.split(',').map(e => e.trim()).filter(Boolean);

  const handleAddCc = () => {
    if (newCc && !ccArray.includes(newCc)) {
      setCc([...ccArray, newCc].join(', '));
      setNewCc('');
    }
  };

  const handleRemoveCc = (email) => {
    const filtered = ccArray.filter(c => c !== email);
    setCc(filtered.join(', '));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className="relative max-w-md w-full bg-[#111111] text-white border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-lg transition-all duration-300">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-400"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">📧 Send Matching Results</h2>

        {/* To Email */}
        <div className="mb-4">
          <label className="text-sm text-gray-400">To</label>
          <input
            type="email"
            value={toEmail}
            readOnly
            className="w-full mt-1 px-4 py-2 rounded bg-gray-900 border border-gray-600 text-sm text-gray-300 cursor-not-allowed"
          />
        </div>

        {/* CC */}
        <div className="mb-4">
          <label className="text-sm text-gray-400">CC</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={newCc}
              onChange={(e) => setNewCc(e.target.value)}
              placeholder="Add email"
              className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-600 text-sm text-white"
            />
            <button
              onClick={handleAddCc}
              className="bg-cyan-400 text-black px-3 rounded hover:bg-cyan-300 transition"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {ccArray.map((email, i) => (
              <span
                key={i}
                className="bg-gray-700 text-sm px-3 py-1 rounded flex items-center gap-1 text-white"
              >
                {email}
                <button onClick={() => handleRemoveCc(email)}>
                  <Minus size={14} className="text-red-400" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <div className="pt-4">
          <button
            onClick={async () => {
              await onSend();
              onClose(); // Close only after sending
            }}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all duration-300"
          >
            <Send size={18} />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
