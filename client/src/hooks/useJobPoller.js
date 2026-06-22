import { useState, useEffect } from 'react';
import { getAiJobStatus } from '../api';

export function useJobPoller(jobId, onComplete) {
  const [stage, setStage] = useState('waiting');
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId || isDone) return;

    const interval = setInterval(async () => {
      try {
        const res = await getAiJobStatus(jobId);
        const data = res.data;
        
        setProgress(data.progress || 0);

        if (data.state === 'waiting' || data.state === 'delayed') {
          setStage('waiting');
        } else if (data.state === 'active') {
          setStage('active');
        } else if (data.state === 'completed') {
          setStage('completed');
          setIsDone(true);
          clearInterval(interval);
          if (onComplete) onComplete(data.result);
        } else if (data.state === 'failed') {
          setStage('failed');
          setError("Processing failed. Please try again.");
          setIsDone(true);
          clearInterval(interval);
        }
      } catch (err) {
        setStage('failed');
        setError("Error fetching job status");
        setIsDone(true);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, onComplete, isDone]);

  return { stage, progress, isDone, error };
}
