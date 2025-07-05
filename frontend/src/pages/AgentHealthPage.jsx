import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Bug,
  Activity,
  FileText,
  Zap,
  Gauge,
} from 'lucide-react';
import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AgentHealthPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealthData = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/tracker/agent-health');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching agent health:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-pulse">
        <Activity className="mr-2 animate-spin" /> Fetching Agent Metrics...
      </div>
    );
  }

  const latencyData = [
    { type: 'JD → Resume', latency: data.latency_stats.jd_to_resume || 0 },
    { type: 'Resume → JD', latency: data.latency_stats.resume_to_jd || 0 },
    { type: 'One-to-One', latency: data.latency_stats.one_to_one || 0 },
  ];

  const matchTypeUsage = [
    { name: 'JD → Resume', value: data.jd_to_resume },
    { name: 'Resume → JD', value: data.resume_to_jd },
    { name: 'One-to-One', value: data.one_to_one },
  ];

  const usageData = data.daily_usage;
  const latencyColors = ['#8B5CF6', '#0EA5E9', '#F97316'];
  const pieColors = ['#C084FC', '#60A5FA', '#FDBA74'];

  const tooltips = [
    'Total number of match operations done by agents',
    'Job Descriptions uploaded to the system',
    'Consultant resumes uploaded for processing',
    'Average score for top match results (0–1)',
    'Percentage of successful matches out of total',
    'Total number of system or matching errors',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-purple-50 text-gray-800 p-8 font-sans">
      <h1 className="text-4xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-500 to-sky-600 animate-gradient-x">
        Agent Intelligence Overview
      </h1>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <MetricCard icon={<Zap />} title="Total Matches" value={data.total_matches} tooltip={tooltips[0]} index={0} />
        <MetricCard icon={<FileText />} title="JDs Uploaded" value={data.jd_uploaded} tooltip={tooltips[1]} index={1} />
        <MetricCard icon={<FileText />} title="Resumes Uploaded" value={data.resumes_uploaded} tooltip={tooltips[2]} index={2} />
        <MetricCard icon={<Gauge />} title="Avg Match Score" value={data.avg_match_score} suffix="/ 1.0" tooltip={tooltips[3]} index={3} />
        <MetricCard icon={<Gauge />} title="Match Success Rate" value={data.match_success_rate} suffix="%" tooltip={tooltips[4]} index={4} />
        <MetricCard icon={<Bug />} title="Total Errors" value={data.total_errors} tooltip={tooltips[5]} index={5} />
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="p-6 rounded-3xl bg-white/70 shadow-md border border-purple-200 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <Gauge className="text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Agent Latency (sec)</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={latencyData}>
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="latency">
                {latencyData.map((entry, index) => (
                  <Cell key={index} fill={latencyColors[index % latencyColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-3xl bg-white/70 shadow-md border border-blue-200 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-sky-600" />
            <h2 className="text-xl font-bold text-gray-900">Daily Agent Usage</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="matches" stroke="#0EA5E9" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most Used Match Type Pie Chart */}
      <div className="p-6 rounded-3xl bg-white/70 shadow-md border border-indigo-200 backdrop-blur-xl mb-12">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Most Used Match Types</h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={matchTypeUsage}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {matchTypeUsage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Error Summary */}
      <div className="p-6 rounded-3xl bg-white/70 shadow-md border border-red-200 backdrop-blur-xl mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Bug className="text-red-500" />
          <h2 className="text-xl font-bold text-gray-900">Agent Error Insights</h2>
        </div>
        <p className="text-gray-600">Resolved: <strong>{data.resolved_errors}</strong></p>
        <p className="text-gray-600">Unresolved: <strong className="text-red-600">{data.unresolved_errors}</strong></p>
        <p className="text-gray-600 mt-2">
          Most Common: <span className="font-semibold text-purple-700">{data.most_common_error}</span>
          {' '}({data.most_common_error_count})
        </p>
      </div>

      <div className="text-center text-sm text-gray-500">
        Last refreshed every <strong>15 seconds</strong>. Powered by RadarX Intelligence Engine.
      </div>
    </div>
  );
}

// Color palette for each card
const cardColors = [
  'from-yellow-100 to-yellow-200 text-yellow-700',
  'from-indigo-100 to-indigo-200 text-indigo-700',
  'from-pink-100 to-pink-200 text-pink-700',
  'from-green-100 to-green-200 text-green-700',
  'from-purple-100 to-purple-200 text-purple-700',
  'from-red-100 to-red-200 text-red-700',
];

function MetricCard({ icon, title, value, suffix, tooltip, index }) {
  const colorClass = `bg-gradient-to-br ${cardColors[index % cardColors.length]}`;
  return (
    <div className="relative group flex items-center gap-4 p-5 rounded-xl bg-white/80 shadow border border-gray-200 font-sans">
      {/* Icon with Tooltip */}
      <div className={`p-3 rounded-full ${colorClass} relative`}>
        {icon}
        {/* Tooltip */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none z-10">
          <div className="bg-gray-900 text-white text-xs px-3 py-1 rounded shadow-md whitespace-nowrap">
            {tooltip}
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 absolute left-1/2 -bottom-1 -translate-x-1/2"></div>
        </div>
      </div>
      {/* Title & Value */}
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <h3 className="text-xl font-bold text-gray-900">
          {value} {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
        </h3>
      </div>
    </div>
  );
}
