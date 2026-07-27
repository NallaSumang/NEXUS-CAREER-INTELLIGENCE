import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  computeMatch,
  generateCoverLetter,
  generateInterviewPrep,
  getResumes,
  getApplications,
} from "../api";
import AIProcessingStatus from "./AIProcessingStatus";

export default function Applications() {
  const location = useLocation();
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobs, setJobs] = useState([]);
  const [activeApplication, setActiveApplication] = useState(null);

  const fetchData = async () => {
    try {
      const [resResumes, resApps] = await Promise.all([
        getResumes(),
        getApplications(),
      ]);
      setResumes(resResumes.data);
      const apps = resApps.data;
      setApplications(apps);

      if (resResumes.data.length > 0 && !selectedResumeId) {
        setSelectedResumeId(resResumes.data[0]._id);
      }

      // If navigated from Dashboard with a pre-selected app, activate it
      setActiveApplication((prev) => {
        const targetId =
          location.state?.selectedAppId || prev?._id;
        if (targetId) {
          return apps.find((a) => a._id === targetId) || prev;
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComputeMatch = async () => {
    if (!selectedResumeId) return alert("NO NEURAL MAP SELECTED.");
    if (!jobDescription.trim())
      return alert("PASTE TARGET CONFIGURATION (JOB DESC).");

    try {
      const res = await computeMatch({
        resumeId: selectedResumeId,
        jobDescription,
      });
      setJobs((prev) => [
        ...prev,
        { id: res.data.queueJobId, type: "compute-match" },
      ]);
      setActiveApplication({ _id: res.data.applicationId });
    } catch (err) {
      console.error("Compute match error:", err);
      alert(err.response?.data?.error || "Match analysis failed.");
    }
  };

  const handleGenerateCoverLetter = async (appId) => {
    if (!appId) return;
    try {
      const res = await generateCoverLetter({ applicationId: appId });
      setJobs((prev) => [
        ...prev,
        { id: res.data.queueJobId, type: "gen-cover-letter" },
      ]);
    } catch (err) {
      console.error("Generate cover letter error:", err);
      alert(err.response?.data?.error || "Cover letter generation failed.");
    }
  };

  const handleGenerateInterviewPrep = async (appId) => {
    if (!appId) return;
    try {
      const res = await generateInterviewPrep({ applicationId: appId });
      setJobs((prev) => [
        ...prev,
        { id: res.data.queueJobId, type: "interview-prep" },
      ]);
    } catch (err) {
      console.error("Interview prep error:", err);
      alert(err.response?.data?.error || "Interview prep generation failed.");
    }
  };

  const handleJobComplete = (jobId) => {
    fetchData();
    setTimeout(() => {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    }, 3000);
  };

  const selectApp = (app) => setActiveApplication(app);

  const handleDownloadCoverLetter = () => {
    if (!activeApplication?.coverLetterText) return;
    const blob = new Blob([activeApplication.coverLetterText], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover_Letter_${activeApplication.jobId?.company || "Company"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadGapAnalysis = () => {
    if (!activeApplication || activeApplication.matchScore === undefined) return;
    const content = `Target Role: ${activeApplication.jobId?.title || "Unknown"}\nCompany: ${activeApplication.jobId?.company || "Unknown"}\n\nMatch Score: ${activeApplication.matchScore}%\n\nVulnerabilities (Missing Skills):\n- ${(activeApplication.missingSkills || []).join("\n- ")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Gap_Analysis_${activeApplication.jobId?.company || "Company"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasScore = activeApplication && activeApplication.matchScore !== undefined;
  const hasCoverLetter = activeApplication?.coverLetterText;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 sm:p-16 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-8"
    >
      <div className="flex-1">
        <div className="mb-16">
          <h2 className="text-5xl font-serif text-white mb-4 tracking-tighter">
            Active Targets
          </h2>
          <p className="text-[10px] tracking-widest uppercase text-[#888888]">
            Analyze Vectors and Synthesize Communication
          </p>
        </div>

        {/* ── New Target Configuration ───────────────────────────────────── */}
        <div className="border border-[#222222] p-8 mb-16">
          <h3 className="text-white text-[10px] tracking-widest uppercase mb-6">
            Target Configuration
          </h3>

          {resumes.length === 0 ? (
            <div className="text-red-500 text-[10px] uppercase tracking-widest mb-6">
              No Neural Maps found. Upload a resume first in the Neural Hub.
            </div>
          ) : (
            <select
              className="w-full bg-[#0A0A0A] border border-[#222222] p-4 text-[#888888] text-sm font-mono mb-6 focus:border-white focus:outline-none transition-colors appearance-none rounded-none"
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
            >
              {resumes.map((r) => (
                <option key={r._id} value={r._id} className="bg-slate-900 text-slate-300 py-2">
                  {r.originalFilename || r.fileName || "Resume"} —{" "}
                  {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}

          <textarea
            className="w-full bg-[#0A0A0A] border border-[#222222] p-4 text-[#888888] text-sm font-mono mb-6 focus:border-white focus:outline-none transition-colors rounded-none resize-none"
            rows="8"
            placeholder="PASTE TARGET JOB DESCRIPTION HERE..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <button
            onClick={handleComputeMatch}
            disabled={resumes.length === 0}
            className="w-full border border-white text-white text-[10px] tracking-widest uppercase font-bold py-5 rounded-none hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Initiate Match Analysis
          </button>
        </div>

        {/* ── Job queue status ───────────────────────────────────────────── */}
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

        {/* ── Active application detail panel ───────────────────────────── */}
        {activeApplication && (
          <div className="mb-16 border border-[#D4AF37] p-8 glass-panel-hover">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-[#D4AF37] text-[10px] tracking-widest uppercase mb-1">
                  {activeApplication.jobId?.title || "Target Role"}
                </h3>
                <p className="text-[#555555] text-[10px] uppercase tracking-widest">
                  {activeApplication.jobId?.company || "Company"}
                </p>
              </div>
              {hasScore && (
                <button
                  onClick={handleDownloadGapAnalysis}
                  className="text-[10px] tracking-widest uppercase text-[#D4AF37] hover:text-white transition-colors"
                >
                  [ Download Gap Analysis ]
                </button>
              )}
            </div>

            {hasScore ? (
              <>
                <div className="flex items-end gap-4 mb-8">
                  <span className="text-6xl font-serif text-[#D4AF37]">
                    {activeApplication.matchScore}%
                  </span>
                  <span className="text-[10px] tracking-widest text-[#888888] uppercase mb-2">
                    ALIGNMENT PROBABILITY
                  </span>
                </div>

                {activeApplication.missingSkills?.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[10px] tracking-widest uppercase text-red-500 mb-3">
                      VULNERABILITIES (MISSING SKILLS)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeApplication.missingSkills.map((skill) => (
                        <span
                          key={skill}
                          className="border border-red-500 text-white text-[10px] uppercase px-3 py-1"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[#555555] text-[10px] uppercase tracking-widest mb-8">
                Analysis in progress or pending...
              </p>
            )}

            {/* ── Action buttons always visible for selected application ── */}
            <div className="pt-6 border-t border-[#222222]">
              <button
                onClick={() => handleGenerateCoverLetter(activeApplication._id)}
                className="w-full border border-white text-white text-[10px] tracking-widest uppercase font-bold py-4 rounded-none hover:bg-white hover:text-black transition-colors"
              >
                Synthesize Cover Letter
              </button>
            </div>
          </div>
        )}

        {/* ── Cover letter output ────────────────────────────────────────── */}
        {hasCoverLetter && (
          <div className="mb-16 border border-[#222222] p-8 glass-panel-hover relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-[10px] tracking-widest uppercase">
                Synthesized Draft
              </h3>
              <button
                onClick={handleDownloadCoverLetter}
                className="text-[10px] tracking-widest uppercase text-[#D4AF37] hover:text-white transition-colors"
              >
                [ Download .txt ]
              </button>
            </div>
            <div className="text-[#888888] font-serif leading-relaxed whitespace-pre-wrap">
              {activeApplication.coverLetterText}
            </div>
          </div>
        )}
      </div>

      {/* ── History sidebar ────────────────────────────────────────────────── */}
      <div className="w-full md:w-80 flex flex-col gap-4 border-l border-[#222222] pl-8">
        <h3 className="text-white text-[10px] tracking-widest uppercase mb-2">
          History
        </h3>
        {applications.length === 0 ? (
          <p className="text-[10px] tracking-widest text-[#555555] uppercase">
            No targets tracked.
          </p>
        ) : (
          applications.map((app) => (
            <button
              key={app._id}
              onClick={() => selectApp(app)}
              className={`p-4 border text-left transition-colors ${activeApplication?._id === app._id ? "border-white bg-[#111111]" : "border-[#222222] hover:border-[#444444]"}`}
            >
              <p className="text-white text-sm font-serif mb-1 truncate">
                {app.jobId?.title || "Target Role"}
              </p>
              <p className="text-[#888888] text-[10px] uppercase tracking-widest mb-3 truncate">
                {app.jobId?.company || "Company"}
              </p>
              <div className="flex justify-between items-center text-[10px] tracking-widest uppercase">
                <span className={app.matchScore ? "text-[#D4AF37]" : "text-[#555555]"}>
                  {app.matchScore ? `${app.matchScore}% Match` : "Unscored"}
                </span>
                <span className="text-[#555555]">
                  {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}