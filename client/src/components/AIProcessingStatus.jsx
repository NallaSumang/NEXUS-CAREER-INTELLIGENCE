import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobPoller } from '../hooks/useJobPoller';

const getMessageForType = (jobType) => {
  switch (jobType) {
    case 'parse-resume': return "EXTRACTING CONTEXT";
    case 'compute-match': return "ANALYZING PARITY";
    case 'gen-cover-letter': return "SYNTHESIZING DRAFT";
    case 'interview-prep': return "GENERATING VECTORS";
    default: return "PROCESSING";
  }
};

export default function AIProcessingStatus({ jobId, jobType, onComplete, onError }) {
  const { stage, isDone, error } = useJobPoller(jobId, onComplete);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (stage === 'completed') {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full border-b border-[#222222] hover:bg-[#111111] transition-colors"
      >
        <div className="grid grid-cols-12 p-6 items-center">
          
          {/* Process ID */}
          <div className="col-span-3">
            <span className="text-[10px] font-mono tracking-widest text-[#555555]">
              {jobId.replace('mock_job_', 'SYS-')}
            </span>
          </div>

          {/* Operation */}
          <div className="col-span-4">
            <span className="text-[10px] tracking-widest uppercase text-white">
              {jobType.replace('-', ' ')}
            </span>
          </div>

          {/* Status Text (Typographic Loading) */}
          <div className="col-span-3">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#888888]">
              {stage === 'waiting' && "QUEUE STANDBY"}
              {stage === 'active' && getMessageForType(jobType)}
              {stage === 'completed' && "OUTPUT GENERATED"}
              {stage === 'failed' && (error || "UNEXPECTED TERMINATION")}
            </span>
          </div>
          
          {/* Indicator */}
          <div className="col-span-2 flex justify-end items-center gap-4">
            {stage === 'active' && (
              <span className="text-[10px] tracking-widest text-[#D4AF37] uppercase flex items-center gap-2">
                PROCESSING
                <span className="w-1.5 h-1.5 rounded-none bg-[#D4AF37] animate-pulse"></span>
              </span>
            )}
            
            {stage === 'completed' && (
              <span className="text-[10px] tracking-widest text-white uppercase flex items-center gap-2">
                READY
                <span className="w-1.5 h-1.5 rounded-none bg-white"></span>
              </span>
            )}

            {stage === 'waiting' && (
              <span className="text-[10px] tracking-widest text-[#444444] uppercase flex items-center gap-2">
                STANDBY
                <span className="w-1.5 h-1.5 rounded-none bg-[#444444]"></span>
              </span>
            )}

            {stage === 'failed' && (
              <span className="text-[10px] tracking-widest text-red-500 uppercase flex items-center gap-2">
                ERROR
                <span className="w-1.5 h-1.5 rounded-none bg-red-500"></span>
              </span>
            )}

            {stage === 'failed' && onError && (
              <button 
                onClick={onError} 
                className="ml-4 px-4 py-1 border border-[#333333] hover:border-white text-[10px] tracking-widest uppercase text-white transition-colors rounded-none"
              >
                RETRY
              </button>
            )}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
