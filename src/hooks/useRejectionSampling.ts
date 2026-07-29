import { useState, useCallback, useRef, useEffect } from 'react';
import { generateSample, isSampleAccepted } from '../lib/inference';
import { Sample, EvidenceConfig, getDefaultNetwork, BayesianNetwork } from '../lib/network';

/**
 * Statistiche in tempo reale per la simulazione del Rejection Sampling.
 */
export type SimulationStats = {
  total: number;             // Numero totale di campioni generati
  accepted: number;          // Numero di campioni che soddisfano tutte le evidenze (accettati)
  rejected: number;          // Numero di campioni scartati (perché non soddisfano l'evidenza)
  acceptedWithQuery: number; // Numero di campioni accettati in cui la variabile query assume il valore richiesto
};

/**
 * Stati dell'animazione per rendere visibile il flusso del campione nella UI.
 */
export type AnimationState = 'idle' | 'generating' | 'evaluating' | 'routing' | 'done';

/**
 * Hook custom di React per gestire la logica, le statistiche e le animazioni del Rejection Sampling.
 */
export function useRejectionSampling() {
  const [network, setNetwork] = useState<BayesianNetwork>(getDefaultNetwork);

  // Stato delle statistiche della simulazione
  const [stats, setStats] = useState<SimulationStats>({
    total: 0,
    accepted: 0,
    rejected: 0,
    acceptedWithQuery: 0,
  });

  // Configurazione della query: P(queryVar = queryVal | evidences)
  const defaultQueryVar = network.nodes.length > 0 ? network.nodes[network.nodes.length - 1].id : '';
  const defaultEvidenceVar = network.nodes.length > 1 ? network.nodes[0].id : defaultQueryVar;
  
  const [queryVar, setQueryVar] = useState<string>(defaultQueryVar);
  const [queryVal, setQueryVal] = useState<boolean>(true);
  const [evidences, setEvidences] = useState<EvidenceConfig[]>([{ var: defaultEvidenceVar, val: true }]);

  // Stati per la gestione del ciclo automatico e dell'animazione
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [currentSample, setCurrentSample] = useState<Sample | null>(null);
  const [animState, setAnimState] = useState<AnimationState>('idle');
  
  // Riferimento al timer per la generazione automatica continua (per poterlo fare clearInterval)
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Aggiorna i contatori delle statistiche dopo ogni campione valutato.
   */
  const updateStats = useCallback((sample: Sample, accepted: boolean) => {
    setStats((prev) => ({
      total: prev.total + 1,
      accepted: prev.accepted + (accepted ? 1 : 0),
      rejected: prev.rejected + (!accepted ? 1 : 0),
      // Incrementa acceptedWithQuery solo se il campione è stato accettato E la query corrisponde
      acceptedWithQuery: prev.acceptedWithQuery + (accepted && sample[queryVar] === queryVal ? 1 : 0),
    }));
  }, [queryVar, queryVal]);

  /**
   * Genera un singolo campione con animazione passo-passo (ideale per la didattica e la visualizzazione).
   */
  const generateSingleSample = useCallback(async () => {
    if (animState !== 'idle' && animState !== 'done') return;
    
    // Fase 1: Generazione topologica nella rete
    setAnimState('generating');
    const newSample = generateSample();
    setCurrentSample(newSample);
    
    // Pausa di 800ms per osservare l'illuminazione dei nodi della rete
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Fase 2: Valutazione nel Gate di Rejection (controllo evidenze)
    setAnimState('evaluating');
    const accepted = isSampleAccepted(newSample, evidences);
    
    // Pausa di 500ms per mostrare il colore del filtro (verde=accettato, rosso=rifiutato)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fase 3: Smistamento del campione verso i cestini/contenitori
    setAnimState('routing');
    
    // Pausa di 500ms per l'animazione di spostamento verso il cesto (Accettati o Trash)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Aggiornamento finale delle statistiche e completamento
    updateStats(newSample, accepted);
    setAnimState('done');
  }, [animState, updateStats, evidences]);

  /**
   * Generazione rapida senza pause di animazione (utilizzata durante la modalità automatica ad alta frequenza).
   */
  const generateFastSample = useCallback(() => {
    const newSample = generateSample();
    const accepted = isSampleAccepted(newSample, evidences);
    setCurrentSample(newSample);
    updateStats(newSample, accepted);
  }, [updateStats, evidences]);

  /**
   * Attiva o disattiva la generazione automatica ad alta frequenza (10 campioni al secondo).
   */
  const toggleAutoGeneration = useCallback(() => {
    setIsAutoGenerating((prev) => !prev);
  }, []);

  // Effetto che gestisce il timer della generazione automatica
  useEffect(() => {
    if (isAutoGenerating) {
      // Esecuzione 10 volte al secondo (ogni 100ms)
      autoIntervalRef.current = setInterval(() => {
        setAnimState('generating'); // Richiama un lampo visivo per feedback immediato
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

  /**
   * Resetta completamente la simulazione e cancella le statistiche accumulate.
   */
  const reset = useCallback(() => {
    setIsAutoGenerating(false);
    setStats({ total: 0, accepted: 0, rejected: 0, acceptedWithQuery: 0 });
    setCurrentSample(null);
    setAnimState('idle');
  }, []);

  /**
   * Imposta una nuova configurazione per la query e le evidenze.
   * Il cambio di impostazioni provoca un reset automatico delle statistiche per evitare incongruenze.
   */
  const setConfig = useCallback((newQueryVar: string, newQueryVal: boolean, newEvidences: EvidenceConfig[]) => {
    setQueryVar(newQueryVar);
    setQueryVal(newQueryVal);
    setEvidences(newEvidences);
    // Auto reset al cambio di configurazione
    setIsAutoGenerating(false);
    setStats({ total: 0, accepted: 0, rejected: 0, acceptedWithQuery: 0 });
    setCurrentSample(null);
    setAnimState('idle');
  }, []);

  return {
    network,
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
