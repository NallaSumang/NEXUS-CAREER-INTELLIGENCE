import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { triggerAnalytics, getAnalytics } from "../api";
import AIProcessingStatus from "./AIProcessingStatus";

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    getAnalytics()
      .then((res) => {
        if (res.data) setAnalyticsData(res.data);
      })
      .catch(console.error);
  }, []);

  const handleTriggerAnalytics = async () => {
    try {
      const res = await triggerAnalytics();
      setJobs([{ id: res.data.queueJobId, type: "analytics" }]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to trigger analytics");
    }
  };

  const handleJobComplete = (jobId) => {
    getAnalytics()
      .then((res) => {
        if (res.data) setAnalyticsData(res.data);
      })
      .catch(console.error);

    setTimeout(() => {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    }, 3000);
  };

  const handleDownloadAnalytics = () => {
    if (!analyticsData) return;
    const content = `Executive Summary:\n${analyticsData.summary}\n\nStrengths:\n- ${(analyticsData.strengths || []).join("\n- ")}\n\nWeaknesses:\n- ${(analyticsData.weaknesses || []).join("\n- ")}\n\nRecommended Actions:\n- ${(analyticsData.recommendedActions || []).join("\n- ")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Career_Trajectory_Analysis.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 sm:p-16 max-w-6xl mx-auto w-full"
    >
      <div className="mb-16">
        <h2 className="text-5xl font-serif text-white mb-4 tracking-tighter">
          Trajectory
        </h2>
        <p className="text-[10px] tracking-widest uppercase text-[#888888]">
          Career Roadmap & Statistical Insight
        </p>
      </div>

      <div className="mb-16">
        <button
          onClick={handleTriggerAnalytics}
          disabled={jobs.length > 0}
          className="w-full border border-white text-white text-[10px] tracking-widest uppercase font-bold py-5 rounded-none hover:bg-white hover:text-black transition-colors disabled:opacity-50"
        >
          {analyticsData
            ? "Refresh Trajectory Analysis"
            : "Generate Trajectory Analysis"}
        </button>
      </div>

      {jobs.length > 0 && (
        <div className="w-full border border-[#222222] mb-16">
          <div className="grid grid-cols-12 border-b border-[#222222] p-6 text-[10px] tracking-widest uppercase text-[#888888]">
            <div className="col-span-3">Process ID</div>
            <div className="col-span-4">Operation</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Indicator</div>
          </div>
          <div className="flex flex-col">
            {jobs.map((job) => (
              <AIProcessingStatus
                key={job.id}
                jobId={job.id}
                jobType={job.type}
                onComplete={() => handleJobComplete(job.id)}
              />
            ))}
          </div>
        </div>
      )}

      {analyticsData ? (
        <div className="border border-[#222222] p-8 glass-panel-hover">
          <div className="flex justify-between items-center border-b border-[#222222] pb-4 mb-6">
            <h3 className="text-white text-[10px] tracking-widest uppercase">
              Roadmap Insights
            </h3>
            <button
              onClick={handleDownloadAnalytics}
              className="text-[10px] tracking-widest uppercase text-[#D4AF37] hover:text-white transition-colors"
            >
              [ Download .txt ]
            </button>
          </div>

          {analyticsData.summary && (
            <div className="mb-8">
              <p className="text-[10px] tracking-widest uppercase text-[#555555] mb-2">
                EXECUTIVE SUMMARY
              </p>
              <p className="text-[#888888] font-serif text-lg leading-relaxed">
                {analyticsData.summary}
              </p>
            </div>
          )}

          {analyticsData.strengths && analyticsData.strengths.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] tracking-widest uppercase text-[#555555] mb-4">
                IDENTIFIED STRENGTHS
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analyticsData.strengths.map((str, idx) => (
                  <div
                    key={idx}
                    className="border border-[#333333] p-4 text-[#888888] text-sm"
                  >
                    {str}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyticsData.weaknesses && analyticsData.weaknesses.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] tracking-widest uppercase text-red-500 mb-4">
                VULNERABILITIES
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analyticsData.weaknesses.map((w, idx) => (
                  <div
                    key={idx}
                    className="border border-red-500 p-4 text-[#888888] text-sm"
                  >
                    {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyticsData.recommended_actions && (
            <div className="mt-8 pt-8 border-t border-[#222222]">
              <p className="text-[10px] tracking-widest uppercase text-[#D4AF37] mb-4">
                SUGGESTED VECTORS
              </p>
              <ul className="list-disc list-inside text-[#888888] space-y-2 text-sm font-mono">
                {analyticsData.recommended_actions.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-[#222222] p-16 text-center glass-panel-hover flex flex-col items-center">
          <span className="text-[#555555] text-[10px] tracking-widest uppercase mb-4 block">
            MODULE INACTIVE
          </span>
          <h3 className="text-white font-serif text-2xl mb-4">
            Awaiting Telemetry Data
          </h3>
          <p className="text-[#888888] max-w-md mx-auto">
            Trigger the analysis above. The Career Roadmap agent requires
            processed applications and matches to generate high-confidence
            trajectory insights.
          </p>
        </div>
      )}
    </motion.div>
  );
}
