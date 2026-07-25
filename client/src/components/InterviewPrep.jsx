import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  generateInterviewPrep,
  getApplications,
  getInterviewNotes,
} from "../api";
import AIProcessingStatus from "./AIProcessingStatus";

export default function InterviewPrep() {
  const [applications, setApplications] = useState([]);
  const [applicationId, setApplicationId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [interviewData, setInterviewData] = useState(null);

  useEffect(() => {
    getApplications()
      .then((res) => {
        setApplications(res.data);
        if (res.data.length > 0) setApplicationId(res.data[0]._id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (applicationId) {
      setInterviewData(null);
      getInterviewNotes(applicationId)
        .then((res) => {
          if (res.data && res.data.generatedQuestions?.length > 0) {
            setInterviewData({ questions: res.data.generatedQuestions });
          }
        })
        .catch(console.error);
    }
  }, [applicationId]);

  const handleGeneratePrep = async () => {
    if (!applicationId) return alert("PLEASE SELECT AN ACTIVE TARGET");

    try {
      const res = await generateInterviewPrep({ applicationId });
      setJobs((prev) => [
        ...prev,
        { id: res.data.queueJobId, type: "interview-prep" },
      ]);
    } catch (err) {
      console.error("Interview prep error:", err);
      alert("Failed to generate interview prep.");
    }
  };

  const handleJobComplete = (jobId, data) => {
    setInterviewData(data);
    setTimeout(() => {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    }, 3000);
  };

  const handleDownloadQuestions = () => {
    if (!interviewData?.questions) return;
    const selectedApp = applications.find((a) => a._id === applicationId);
    const content = interviewData.questions
      .map(
        (q, i) =>
          `Q${i + 1} [${q.category || q.type || "BEHAVIORAL"}]: ${q.question}\nRationale: ${q.why_asked || q.rationale}\n\n`,
      )
      .join("");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Interview_Prep_${selectedApp?.jobId?.company || "Company"}.txt`;
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
          Combat Prep
        </h2>
        <p className="text-[10px] tracking-widest uppercase text-[#888888]">
          Simulated Interview Coach
        </p>
      </div>

      <div className="border border-[#222222] p-8 mb-16">
        <h3 className="text-white text-[10px] tracking-widest uppercase mb-6">
          Target Selection
        </h3>

        {applications.length === 0 ? (
          <div className="text-red-500 text-[10px] uppercase tracking-widest mb-6">
            No targets tracked. Add one in Active Targets.
          </div>
        ) : (
          <select
            className="w-full bg-[#0A0A0A] border border-[#222222] p-4 text-[#888888] text-sm font-mono mb-6 focus:border-white focus:outline-none transition-colors appearance-none rounded-none"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
          >
            {applications.map((app) => (
              <option key={app._id} value={app._id}>
                {app.jobId?.title || "Target Role"} at{" "}
                {app.jobId?.company || "Company"} (
                {new Date(app.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        )}

        <div className="flex border-t border-[#222222] pt-8">
          <button
            onClick={handleGeneratePrep}
            disabled={!applicationId}
            className="flex-1 bg-white text-black text-[10px] tracking-widest uppercase font-bold py-5 rounded-none hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {interviewData ? "Regenerate Vectors" : "Generate Vectors"}
          </button>
        </div>
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
                onComplete={(data) => handleJobComplete(job.id, data)}
              />
            ))}
          </div>
        </div>
      )}

      {interviewData && (
        <div className="mb-16 space-y-8">
          <div className="flex justify-between items-center border-b border-[#222222] pb-4 mb-6">
            <h3 className="text-white text-[10px] tracking-widest uppercase">
              Simulated Questions
            </h3>
            <button
              onClick={handleDownloadQuestions}
              className="text-[10px] tracking-widest uppercase text-[#D4AF37] hover:text-white transition-colors"
            >
              [ Download .txt ]
            </button>
          </div>

          {(interviewData.questions || []).map((q, idx) => (
            <div
              key={idx}
              className="border border-[#222222] p-8 glass-panel-hover"
            >
              <p className="text-[10px] tracking-widest uppercase text-[#555555] mb-2">
                {q.category || q.type || "BEHAVIORAL"} QUESTION
              </p>
              <p className="text-white font-serif text-xl mb-4">{q.question}</p>
              <div className="bg-[#111111] p-4 text-[#888888] text-sm font-mono border-l-2 border-[#555555]">
                <span className="text-[10px] tracking-widest uppercase text-[#555555] block mb-2">
                  EXPECTED VECTOR (RATIONALE)
                </span>
                {q.why_asked || q.rationale}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
