import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { uploadResume, getResumes, deleteResume } from "../api";
import AIProcessingStatus from "./AIProcessingStatus";

export default function ResumeHub() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);

  const fetchResumes = () => {
    getResumes()
      .then((res) => setResumes(res.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (file.type !== "application/pdf") {
      alert("PLEASE UPLOAD A PDF FILE.");
      return;
    }
    const formData = new FormData();
    formData.append("resume", file);

    setUploading(true);
    try {
      const res = await uploadResume(formData);
      setJobs((prev) => [
        ...prev,
        {
          id: res.data.queueJobId,
          type: "parse-resume",
          resumeId: res.data.resumeId,
        },
      ]);
    } catch (error) {
      console.error("Upload failed", error);
      const msg =
        error.response?.data?.error || error.message || "UPLOAD FAILED";
      alert(`UPLOAD FAILED: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleJobComplete = (jobId) => {
    fetchResumes(); // Pull persisted data from server
    setTimeout(() => {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    }, 3000);
  };

  const handleDelete = async (id) => {
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleDownloadResume = (resume) => {
    const technical = resume?.parsedJson?.metrics?.technical_skills || [];
    const soft = resume?.parsedJson?.metrics?.soft_skills || [];
    const content = `Candidate Name: ${resume?.parsedJson?.candidate_name || "Unknown"}\n\nTechnical Skills:\n- ${technical.join("\n- ")}\n\nSoft Skills:\n- ${soft.join("\n- ")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Resume_Analysis_${resume?.originalFilename || "Resume"}.txt`;
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
          Neural Hub
        </h2>
        <p className="text-[10px] tracking-widest uppercase text-[#888888]">
          Ingest and Process Document Vectors
        </p>
      </div>

      <div
        className={`relative p-12 sm:p-20 border ${dragActive ? "border-white bg-[#111111]" : "border-[#222222] hover:border-[#444444]"} transition-colors duration-500 flex flex-col items-center justify-center mb-16`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <p className="text-[10px] tracking-widest uppercase text-[#888888] mb-8">
            {uploading ? "AWAITING UPLOAD..." : "Drop PDF format up to 5MB"}
          </p>
          <label className="cursor-pointer inline-block">
            <span className="border border-[#333333] hover:border-white text-white text-[10px] tracking-widest uppercase py-4 px-10 rounded-none transition-colors">
              {uploading ? "INGESTING..." : "SELECT FILE"}
            </span>
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
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
                onComplete={() => handleJobComplete(job.id)}
              />
            ))}
          </div>
        </div>
      )}

      {resumes.length > 0 && (
        <div className="space-y-8">
          <h3 className="text-white text-[10px] tracking-widest uppercase mb-6 border-b border-[#222222] pb-4">
            Indexed Profiles ({resumes.length})
          </h3>
          {resumes.map((resume) => {
            const parsed = resume.parsedJson || {};
            const technical = parsed.metrics?.technical_skills || [];
            const soft = parsed.metrics?.soft_skills || [];
            const isParsed = resume.parseStatus === "done";
            return (
              <div
                key={resume._id}
                className="border border-[#222222] p-8 glass-panel-hover"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-white font-serif text-xl mb-1">
                      {parsed.candidate_name || resume.originalFilename || "Unknown Entity"}
                    </p>
                    <p className="text-[10px] tracking-widest uppercase text-[#555555]">
                      {resume.originalFilename}
                    </p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span
                      className={`text-[10px] tracking-widest uppercase px-3 py-1 border ${
                        isParsed
                          ? "border-[#D4AF37] text-[#D4AF37]"
                          : resume.parseStatus === "processing"
                          ? "border-blue-500 text-blue-500"
                          : resume.parseStatus === "failed"
                          ? "border-red-500 text-red-500"
                          : "border-[#555555] text-[#555555]"
                      }`}
                    >
                      {resume.parseStatus?.toUpperCase() || "PENDING"}
                    </span>
                    {isParsed && (
                      <button
                        onClick={() => handleDownloadResume(resume)}
                        className="text-[10px] tracking-widest uppercase text-[#D4AF37] hover:text-white transition-colors"
                      >
                        [ Download ]
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="text-[10px] tracking-widest uppercase text-red-500 hover:text-white transition-colors"
                    >
                      [ Delete ]
                    </button>
                  </div>
                </div>

                {isParsed && (technical.length > 0 || soft.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {technical.length > 0 && (
                      <div>
                        <p className="text-[10px] tracking-widest uppercase text-[#555555] mb-3">
                          Technical Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {technical.map((skill) => (
                            <span
                              key={skill}
                              className="border border-sky-500/30 text-sky-400 text-[10px] uppercase px-3 py-1"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {soft.length > 0 && (
                      <div>
                        <p className="text-[10px] tracking-widest uppercase text-[#555555] mb-3">
                          Soft Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {soft.map((skill) => (
                            <span
                              key={skill}
                              className="border border-[#333333] text-[#888888] text-[10px] uppercase px-3 py-1"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isParsed && resume.parseStatus !== "failed" && (
                  <p className="text-[10px] tracking-widest uppercase text-[#555555]">
                    AI parsing in progress — refresh to update.
                  </p>
                )}
                {resume.parseStatus === "failed" && (
                  <p className="text-[10px] tracking-widest uppercase text-red-500">
                    Parse failed. Please re-upload this resume.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}