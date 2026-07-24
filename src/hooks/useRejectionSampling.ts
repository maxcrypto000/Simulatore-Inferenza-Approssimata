import { useState, useCallback, useRef, useEffect } from 'react';
import { generateSample, isSampleAccepted, Sample, EvidenceConfig } from '../lib/inference';

export type SimulationStats = {
  total: number;
  accepted: number;
  rejected: number;
  acceptedWithQuery: number; // For dynamic query
};

export type AnimationState = 'idle' | 'generating' | 'evaluating' | 'routing' | 'done';

export function useRejectionSampling() {
  const [stats, setStats] = useState<SimulationStats>({
    total: 0,
    accepted: 0,
    rejected: 0,
    acceptedWithQuery: 0,
  });

  const [queryVar, setQueryVar] = useState<keyof Sample>('S');
  const [queryVal, setQueryVal] = useState<boolean>(true);
  const [evidences, setEvidences] = useState<EvidenceConfig[]>([{ var: 'C', val: true }]);

  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [currentSample, setCurrentSample] = useState<Sample | null>(null);
  const [animState, setAnimState] = useState<AnimationState>('idle');
  
  // Track interval for auto generation
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stats update function
  const updateStats = useCallback((sample: Sample, accepted: boolean) => {
    setStats((prev) => ({
      total: prev.total + 1,
      accepted: prev.accepted + (accepted ? 1 : 0),
      rejected: prev.rejected + (!accepted ? 1 : 0),
      acceptedWithQuery: prev.acceptedWithQuery + (accepted && sample[queryVar] === queryVal ? 1 : 0),
    }));
  }, [queryVar, queryVal]);

  // Generate a single sample step-by-step
  const generateSingleSample = useCallback(async () => {
    if (animState !== 'idle' && animState !== 'done') return;
    
    setAnimState('generating');
    const newSample = generateSample();
    setCurrentSample(newSample);
    
    // Simulate generation time (graph lighting up)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setAnimState('evaluating');
    const accepted = isSampleAccepted(newSample, evidences);
    
    // Simulate gate evaluation time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAnimState('routing');
    
    // Simulate routing to bin
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateStats(newSample, accepted);
    setAnimState('done');
  }, [animState, updateStats]);

  // Fast generation step (skips long animations)
  const generateFastSample = useCallback(() => {
    const newSample = generateSample();
    const accepted = isSampleAccepted(newSample, evidences);
    setCurrentSample(newSample);
    updateStats(newSample, accepted);
  }, [updateStats, evidences]);

  // Toggle Auto Generation (10x / sec)
  const toggleAutoGeneration = useCallback(() => {
    setIsAutoGenerating((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isAutoGenerating) {
      // 10 times per second
      autoIntervalRef.current = setInterval(() => {
        setAnimState('generating'); // Just to trigger visual fast flashes
        generateFastSample();
      }, 100);
    } else {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
      }
      setAnimState('idle');
    }

    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    };
  }, [isAutoGenerating, generateFastSample]);

  // Reset simulation
  const reset = useCallback(() => {
    setIsAutoGenerating(false);
    setStats({ total: 0, accepted: 0, rejected: 0, acceptedWithQuery: 0 });
    setCurrentSample(null);
    setAnimState('idle');
  }, []);

  // Update Config
  const setConfig = useCallback((newQueryVar: keyof Sample, newQueryVal: boolean, newEvidences: EvidenceConfig[]) => {
    setQueryVar(newQueryVar);
    setQueryVal(newQueryVal);
    setEvidences(newEvidences);
    // Auto reset when config changes
    setIsAutoGenerating(false);
    setStats({ total: 0, accepted: 0, rejected: 0, acceptedWithQuery: 0 });
    setCurrentSample(null);
    setAnimState('idle');
  }, []);

  return {
    stats,
    isAutoGenerating,
    currentSample,
    animState,
    queryVar,
    queryVal,
    evidences,
    generateSingleSample,
    toggleAutoGeneration,
    reset,
    setConfig,
  };
}
