import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getResumes, getApplications } from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [resumeCount, setResumeCount] = useState(0);
  const [appCount, setAppCount] = useState(0);
  const [recentApps, setRecentApps] = useState([]);

  useEffect(() => {
    getResumes().then(res => setResumeCount(res.data.length)).catch(console.error);
    getApplications().then(res => {
      setAppCount(res.data.length);
      // Get 3 most recent apps (assuming they are sorted by date from backend)
      setRecentApps(res.data.slice(0, 3));
    }).catch(console.error);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 sm:p-16 max-w-6xl mx-auto w-full"
    >
      <div className="mb-16">
        <h2 className="text-5xl font-serif text-white mb-4 tracking-tighter">Command Center</h2>
        <p className="text-[10px] tracking-widest uppercase text-[#888888]">System Overview & Telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="border border-[#222222] p-8 glass-panel-hover">
          <h3 className="text-[#888888] text-[10px] tracking-widest uppercase mb-4">Neural Maps</h3>
          <p className="text-6xl font-serif text-white mb-2">{resumeCount}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#555555]">Indexed Resumes</p>
        </div>
        
        <div className="border border-[#222222] p-8 glass-panel-hover">
          <h3 className="text-[#888888] text-[10px] tracking-widest uppercase mb-4">Active Targets</h3>
          <p className="text-6xl font-serif text-white mb-2">{appCount}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#555555]">Applications Tracked</p>
        </div>

        <div className="border border-[#222222] p-8 glass-panel-hover">
          <h3 className="text-[#888888] text-[10px] tracking-widest uppercase mb-4">System Status</h3>
          <p className="text-xl font-serif text-[#D4AF37] mt-4 mb-2 flex items-center gap-3">
            <span className="w-2 h-2 rounded-none bg-[#D4AF37] animate-pulse"></span>
            OPTIMAL
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[#555555]">All 6 Agents Online</p>
        </div>
      </div>

      <div className="border border-[#222222] p-8">
        <h3 className="text-white text-[10px] tracking-widest uppercase mb-6 border-b border-[#222222] pb-4">Recent Activity</h3>
        
        {recentApps.length > 0 ? (
          <div className="flex flex-col">
            <div className="grid grid-cols-12 border-b border-[#222222] pb-4 mb-4 text-[10px] tracking-widest uppercase text-[#555555]">
              <div className="col-span-4">Target Role</div>
              <div className="col-span-4">Company</div>
              <div className="col-span-2">Match</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {recentApps.map((app) => (
              <div 
                key={app._id} 
                onClick={() => navigate('/applications', { state: { selectedAppId: app._id } })}
                className="grid grid-cols-12 items-center border-b border-[#111111] last:border-0 py-4 hover:bg-[#111111] transition-colors -mx-8 px-8 cursor-pointer"
              >
                <div className="col-span-4 text-white text-sm font-serif truncate pr-4">{app.jobId?.title || "Target Role"}</div>
                <div className="col-span-4 text-[#888888] text-[10px] uppercase tracking-widest truncate pr-4">{app.jobId?.company || "Target Company"}</div>
                <div className={`col-span-2 text-[10px] uppercase tracking-widest ${app.matchScore ? 'text-[#D4AF37]' : 'text-[#555555]'}`}>
                  {app.matchScore ? `${app.matchScore}%` : 'Unscored'}
                </div>
                <div className="col-span-2 text-right text-[10px] uppercase tracking-widest text-white">
                  {app.status || 'Saved'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#555555] text-[10px] uppercase tracking-widest">
            No recent telemetry data available.
          </div>
        )}
      </div>
    </motion.div>
  );
}
