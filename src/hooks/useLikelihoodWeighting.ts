import { useState, useCallback, useRef, useEffect } from 'react';
import { generateLWSample, LWSampleResult } from '../lib/likelihoodWeighting';
import { Sample, EvidenceConfig } from '../lib/inference';

/**
 * Statistiche accumulate durante la simulazione del Likelihood Weighting.
 */
export type LWStats = {
  iterations: number;   // Numero di iterazioni (campioni generati, nessuno viene scartato!)
  totalWeight: number;  // Somma totale dei pesi di tutti i campioni generati: W = Σ w_i
  queryWeight: number;  // Somma dei pesi dei soli campioni che soddisfano la condizione della query: W_query = Σ (w_i se queryVar == queryVal)
};

/**
 * Stati di animazione per il ciclo visivo del Likelihood Weighting.
 */
export type LWAnimationState = 'idle' | 'generating' | 'evaluating' | 'done';

/**
 * Hook custom per la gestione dello stato e della logica di Likelihood Weighting (Pesatura della Verosimiglianza).
 */
export function useLikelihoodWeighting() {
  const [stats, setStats] = useState<LWStats>({ iterations: 0, totalWeight: 0, queryWeight: 0 });
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<LWSampleResult | null>(null);
  const [animState, setAnimState] = useState<LWAnimationState>('idle');
  
  // Impostazioni della query bayesiana
  const [queryVar, setQueryVar] = useState<keyof Sample>('S');
  const [queryVal, setQueryVal] = useState<boolean>(true);
  const [evidences, setEvidences] = useState<EvidenceConfig[]>([{ var: 'C', val: true }]);
  
  const autoGenRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Aggiorna le statistiche sommandole ai pesi accumulati.
   * La probabilità stimata P(Query | Evidenze) si calcolerà come: queryWeight / totalWeight.
   */
  const updateStats = useCallback((result: LWSampleResult) => {
    setStats(prev => {
      const newTotalWeight = prev.totalWeight + result.weight;
      // Se nel campione generato la variabile query corrisponde al valore cercato, sommiamo il suo peso
      const newQueryWeight = prev.queryWeight + ((result.sample[queryVar] === queryVal) ? result.weight : 0);
      
      return {
        iterations: prev.iterations + 1,
        totalWeight: newTotalWeight,
        queryWeight: newQueryWeight
      };
    });
  }, [queryVar, queryVal]);

  /**
   * Generazione di un singolo campione con pause per l'animazione visiva.
   */
  const generateSingleSample = useCallback(async () => {
    if (animState !== 'idle' && animState !== 'done') return;

    setAnimState('generating');
    setCurrentResult(null); // Pulisce il risultato precedente
    
    // Breve pausa di reset della UI
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Genera il campione forzando le evidenze e calcolando il peso w
    const newResult = generateLWSample(evidences);
    setCurrentResult(newResult);
    
    // Pausa per simulare il campionamento topologico visivo
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setAnimState('evaluating');
    
    // Pausa per mostrare il calcolo del moltiplicatore di peso e la formula nella UI
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateStats(newResult);
    setAnimState('done');
  }, [animState, updateStats, evidences]);

  /**
   * Generazione istantanea senza ritardi animati per la modalità ad alta velocità (10x/sec).
   */
  const generateFastSample = useCallback(() => {
    const newResult = generateLWSample(evidences);
    setCurrentResult(newResult);
    updateStats(newResult);
  }, [updateStats, evidences]);

  /**
   * Attiva o disattiva il campionamento automatico continuo a 10 Hz.
   */
  const toggleAutoGeneration = useCallback(() => {
    setIsAutoGenerating(prev => !prev);
  }, []);

  useEffect(() => {
    if (isAutoGenerating) {
      setAnimState('idle'); // Disattiva animazioni complesse per garantire la fluidità del fast mode
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

  /**
   * Resetta i contatori di peso e iterazioni della simulazione LW.
   */
  const reset = useCallback(() => {
    setIsAutoGenerating(false);
    setStats({ iterations: 0, totalWeight: 0, queryWeight: 0 });
    setCurrentResult(null);
    setAnimState('idle');
  }, []);

  /**
   * Aggiorna la configurazione di query ed evidenze e ripristina la simulazione.
   */
  const setConfig = useCallback((newQueryVar: keyof Sample, newQueryVal: boolean, newEvidences: EvidenceConfig[]) => {
    setQueryVar(newQueryVar);
    setQueryVal(newQueryVal);
    setEvidences(newEvidences);
    // Reset automatico quando cambiano i parametri
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
