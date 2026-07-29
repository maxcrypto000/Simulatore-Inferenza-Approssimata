/**
 * Modulo di inferenza per il Likelihood Weighting (Pesatura della Verosimiglianza).
 * Utilizza la struttura dinamica della Rete Bayesiana e il calcolo topologico
 * importati dal modulo centrale `network.ts`.
 */

import { 
  Sample, 
  EvidenceConfig,
  BayesianNetwork,
  getDefaultNetwork,
  getTopologicalOrder,
  getProbability,
  flipCoin 
} from './network';

/**
 * Risultato della generazione di un singolo campione tramite Likelihood Weighting.
 */
export interface LWSampleResult {
  sample: Sample;                                      // Il campione completo (con nodi evidenza fissati)
  weight: number;                                      // Il peso accumulato per questo campione: w = Π P(e_i | Genitori(E_i))
  stepWeights: Partial<Record<string, number>>;  // Dettaglio dei moltiplicatori di peso per singolo nodo (per visualizzazione UI)
}

/**
 * Genera un campione utilizzando l'algoritmo di Likelihood Weighting (Pesatura della Verosimiglianza).
 * 
 * Differenza cruciale rispetto al Rejection Sampling:
 * - Nel Rejection Sampling si genera un campione casuale puro e lo si SCARTA se non corrisponde all'evidenza (con enorme spreco di calcolo se l'evidenza è rara).
 * - Nel Likelihood Weighting NESSUN campione viene scartato. Quando si incontra una variabile di evidenza:
 *   1. Il suo valore viene FORZATO al valore osservato nell'evidenza.
 *   2. Il peso globale `weight` del campione viene moltiplicato per la probabilità di osservare quel valore dati i suoi genitori attuali: w = w * P(E=e | Genitori).
 * - Quando si incontra una variabile NON di evidenza, la si campiona normalmente dalle sue CPT senza modificare il peso.
 * 
 * L'algoritmo è 100% dinamico e percorre la rete in ordine topologico (Kahn's algorithm).
 * 
 * @param evidences Lista delle evidenze (es. [{ var: 'C', val: true }])
 * @param network La rete bayesiana su cui operare (opzionale, default: rete iniziale)
 * @returns Il campione generato, il peso totale calcolato e i pesi intermedi per l'animazione
 */
export function generateLWSample(evidences: EvidenceConfig[], network: BayesianNetwork = getDefaultNetwork()): LWSampleResult {
  let weight = 1.0;
  const stepWeights: Partial<Record<string, number>> = {};
  const sampleData: Record<string, boolean> = {};

  const topOrder = getTopologicalOrder(network);

  for (const nodeId of topOrder) {
    const ev = evidences.find(e => e.var === nodeId);
    const pTrue = getProbability(network, nodeId, sampleData, true);

    if (ev !== undefined) {
      // Nodo di evidenza -> fissiamo il valore all'osservazione
      sampleData[nodeId] = ev.val;
      const probVal = ev.val ? pTrue : (1.0 - pTrue);
      // Aggiorna il peso globale w = w * P(E=e | Genitori(E))
      weight *= probVal;
      stepWeights[nodeId] = probVal;
    } else {
      // Campionamento normale dalla probabilità condizionata (o a priori)
      const val = flipCoin(pTrue);
      sampleData[nodeId] = val;
    }
  }

  return {
    sample: sampleData as unknown as Sample,
    weight,
    stepWeights,
  };
}

/**
 * Wrapper per compatibilità con chiamate che passano prima la rete e poi le evidenze
 * (es. durante l'Evidential Integration in cui la rete viene trasformata dinamicamente).
 * 
 * @param network Rete bayesiana dinamica
 * @param evidences Lista di evidenze
 * @returns Risultato del campionamento LW
 */
export function generateDynamicLWSample(network: BayesianNetwork, evidences: EvidenceConfig[]): LWSampleResult {
  return generateLWSample(evidences, network);
}
