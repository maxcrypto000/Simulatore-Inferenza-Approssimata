import { useState, useCallback, useRef, useEffect } from 'react';
import { LWSampleResult } from '../lib/likelihoodWeighting';
import { Sample, EvidenceConfig } from '../lib/network';
import { 
  BayesianNetwork, 
  getDefaultNetwork, 
  integrateEvidence, 
  generateDynamicLWSample 
} from '../lib/evidenceIntegration';

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
 * Hook custom per la gestione dello stato e della logica di Likelihood Weighting (Pesatura della Verosimiglianza)
 * con supporto dinamico per Evidential Integration (Arc Reversal / Algoritmo di Shachter).
 */
export function useLikelihoodWeighting() {
  const [stats, setStats] = useState<LWStats>({ iterations: 0, totalWeight: 0, queryWeight: 0 });
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<LWSampleResult | null>(null);
  const [animState, setAnimState] = useState<LWAnimationState>('idle');
  
  // Impostazioni della query bayesiana
  const defaultQueryVar = getDefaultNetwork().nodes.length > 0 ? getDefaultNetwork().nodes[getDefaultNetwork().nodes.length - 1].id : '';
  const defaultEvidenceVar = getDefaultNetwork().nodes.length > 1 ? getDefaultNetwork().nodes[0].id : defaultQueryVar;
  
  const [queryVar, setQueryVar] = useState<string>(defaultQueryVar);
  const [queryVal, setQueryVal] = useState<boolean>(true);
  const [evidences, setEvidences] = useState<EvidenceConfig[]>([{ var: defaultEvidenceVar, val: true }]);
  
  // Stato dinamico del Grafo e delle CPT (per Evidential Integration)
  const [network, setNetwork] = useState<BayesianNetwork>(() => getDefaultNetwork());
  const [isIntegrated, setIsIntegrated] = useState<boolean>(false);
  const [reversals, setReversals] = useState<{ from: string; to: string }[]>([]);

  const autoGenRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Aggiorna le statistiche sommandole ai pesi accumulati.
   */
  const updateStats = useCallback((result: LWSampleResult) => {
    setStats(prev => {
      const newTotalWeight = prev.totalWeight + result.weight;
      const newQueryWeight = prev.queryWeight + ((result.sample[queryVar] === queryVal) ? result.weight : 0);
      
      return {
        iterations: prev.iterations + 1,
        totalWeight: newTotalWeight,
        queryWeight: newQueryWeight
      };
    });
  }, [queryVar, queryVal]);

  /**
   * Generazione di un singolo campione utilizzando il motore dinamico della rete bayesiana.
   */
  const generateSingleSample = useCallback(async () => {
    if (animState !== 'idle' && animState !== 'done') return;

    setAnimState('generating');
    setCurrentResult(null);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Genera il campione sulla topologia corrente (originale o trasformata da Evidential Integration)
    const newResult = generateDynamicLWSample(network, evidences);
    setCurrentResult(newResult);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setAnimState('evaluating');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateStats(newResult);
    setAnimState('done');
  }, [animState, updateStats, evidences, network]);

  /**
   * Generazione istantanea senza ritardi animati per la modalità ad alta velocità (10x/sec).
   */
  const generateFastSample = useCallback(() => {
    const newResult = generateDynamicLWSample(network, evidences);
    setCurrentResult(newResult);
    updateStats(newResult);
  }, [updateStats, evidences, network]);

  /**
   * Attiva o disattiva il campionamento automatico continuo a 10 Hz.
   */
  const toggleAutoGeneration = useCallback(() => {
    setIsAutoGenerating(prev => !prev);
  }, []);

  useEffect(() => {
    if (isAutoGenerating) {
      setAnimState('idle');
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
   * Applica l'algoritmo di Evidential Integration (Arc Reversal di Shachter)
   * trasformando la topologia e ricalcolando dinamicamente le CPT.
   */
  const applyEvidenceIntegration = useCallback(() => {
    const initialNet = getDefaultNetwork();
    const { network: newNet, reversals: newReversals } = integrateEvidence(initialNet, evidences);
    
    setNetwork(newNet);
    setReversals(newReversals);
    setIsIntegrated(true);
    
    // Reset della simulazione per ripartire sulla nuova rete
    setIsAutoGenerating(false);
    setStats({ iterations: 0, totalWeight: 0, queryWeight: 0 });
    setCurrentResult(null);
    setAnimState('idle');
  }, [evidences]);

  /**
   * Ripristina la topologia e le CPT originali della rete bayesiana.
   */
  const resetNetworkTopology = useCallback(() => {
    setNetwork(getDefaultNetwork());
    setReversals([]);
    setIsIntegrated(false);
    
    setIsAutoGenerating(false);
    setStats({ iterations: 0, totalWeight: 0, queryWeight: 0 });
    setCurrentResult(null);
    setAnimState('idle');
  }, []);

  /**
   * Resetta i contatori di peso e iterazioni della simulazione LW senza cambiare la topologia.
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
  const setConfig = useCallback((newQueryVar: string, newQueryVal: boolean, newEvidences: EvidenceConfig[]) => {
    setQueryVar(newQueryVar);
    setQueryVal(newQueryVal);
    setEvidences(newEvidences);
    
    // Se cambiano le evidenze e la rete era integrata, ripristiniamo la rete iniziale per evitare stati incoerenti
    setNetwork(getDefaultNetwork());
    setReversals([]);
    setIsIntegrated(false);

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
    network,
    isIntegrated,
    reversals,
    generateSingleSample,
    toggleAutoGeneration,
    reset,
    setConfig,
    applyEvidenceIntegration,
    resetNetworkTopology,
  };
}
