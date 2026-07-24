import { useState, useCallback, useRef, useEffect } from 'react';
import { generateLWSample, LWSampleResult } from '../lib/likelihoodWeighting';
import { Sample, EvidenceConfig } from '../lib/inference';

export type LWStats = {
  iterations: number;
  totalWeight: number;
  queryWeight: number; // Sum of weights where S = true
};

export type LWAnimationState = 'idle' | 'generating' | 'evaluating' | 'done';

export function useLikelihoodWeighting() {
  const [stats, setStats] = useState<LWStats>({ iterations: 0, totalWeight: 0, queryWeight: 0 });
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<LWSampleResult | null>(null);
  const [animState, setAnimState] = useState<LWAnimationState>('idle');
  
  const [queryVar, setQueryVar] = useState<keyof Sample>('S');
  const [queryVal, setQueryVal] = useState<boolean>(true);
  const [evidences, setEvidences] = useState<EvidenceConfig[]>([{ var: 'C', val: true }]);
  
  const autoGenRef = useRef<NodeJS.Timeout | null>(null);

  const updateStats = useCallback((result: LWSampleResult) => {
    setStats(prev => {
      const newTotalWeight = prev.totalWeight + result.weight;
      // query is dynamic
      const newQueryWeight = prev.queryWeight + ((result.sample[queryVar] === queryVal) ? result.weight : 0);
      
      return {
        iterations: prev.iterations + 1,
        totalWeight: newTotalWeight,
        queryWeight: newQueryWeight
      };
    });
  }, []);

  // Single step generation with animations
  const generateSingleSample = useCallback(async () => {
    setAnimState('generating');
    setCurrentResult(null); // Clear previous
    
    // Allow UI to reset briefly
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const newResult = generateLWSample(evidences);
    setCurrentResult(newResult);
    
    // Simulate generation time (topological sort visual)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setAnimState('evaluating');
    
    // Simulate gate/weight calculation time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateStats(newResult);
    setAnimState('done');
  }, [updateStats]);

  // Fast generation step (skips long animations)
  const generateFastSample = useCallback(() => {
    const newResult = generateLWSample(evidences);
    setCurrentResult(newResult);
    updateStats(newResult);
  }, [updateStats, evidences]);

  // Toggle Auto Generation (10x / sec)
  const toggleAutoGeneration = useCallback(() => {
    setIsAutoGenerating(prev => !prev);
  }, []);

  useEffect(() => {
    if (isAutoGenerating) {
      setAnimState('idle'); // no animations in fast mode
      autoGenRef.current = setInterval(() => {
        generateFastSample();
      }, 100);
    } else {
      if (autoGenRef.current) {
        clearInterval(autoGenRef.current);
      }
    }
    return () => {
      if (autoGenRef.current) clearInterval(autoGenRef.current);
    };
  }, [isAutoGenerating, generateFastSample]);

  const reset = useCallback(() => {
    setIsAutoGenerating(false);
    setStats({ iterations: 0, totalWeight: 0, queryWeight: 0 });
    setCurrentResult(null);
    setAnimState('idle');
  }, []);

  const setConfig = useCallback((newQueryVar: keyof Sample, newQueryVal: boolean, newEvidences: EvidenceConfig[]) => {
    setQueryVar(newQueryVar);
    setQueryVal(newQueryVal);
    setEvidences(newEvidences);
    // Auto reset when config changes
    setIsAutoGenerating(false);
    setStats({ iterations: 0, totalWeight: 0, queryWeight: 0 });
    setCurrentResult(null);
    setAnimState('idle');
  }, []);

  return {
    stats,
    isAutoGenerating,
    currentResult,
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
