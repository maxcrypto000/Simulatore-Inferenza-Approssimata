/**
 * Modulo di inferenza per il Rejection Sampling (Campionamento con Rifiuto).
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
  flipCoin,
} from './network';

// Riesportiamo i tipi base per comodità di importazione nei componenti
export type { Sample, EvidenceConfig } from './network';

/**
 * Genera un singolo campione casuale per la rete bayesiana (Prior Sampling), 
 * procedendo dinamicamente e scrupolosamente secondo l'ordine topologico dei nodi (da genitori a figli).
 * 
 * Invece di avere istruzioni hardcoded e ad-hoc per le 6 variabili del problema,
 * l'algoritmo percorre la topologia della rete specificata e consulta in tempo reale le CPT.
 * 
 * @param network La rete bayesiana da campionare (opzionale, default: rete iniziale)
 * @returns Un oggetto Sample contenente i valori generati per tutti i nodi della rete
 */
export function generateSample(network: BayesianNetwork = getDefaultNetwork()): Sample {
  const topOrder = getTopologicalOrder(network);
  const sampleData: Record<string, boolean> = {};

  for (const nodeId of topOrder) {
    const pTrue = getProbability(network, nodeId, sampleData, true);
    sampleData[nodeId] = flipCoin(pTrue);
  }

  return sampleData as unknown as Sample;
}

/**
 * Valuta se un campione generato rispetta integralmente l'insieme delle evidenze specificate (filtro AND).
 * Nel Rejection Sampling, se questa funzione restituisce `false`, il campione viene scartato.
 * 
 * @param sample Il campione da verificare
 * @param evidences Array di configurazioni di evidenza (es. [{ var: 'C', val: true }])
 * @returns true se il campione soddisfa TUTTE le evidenze, false altrimenti
 */
export function isSampleAccepted(sample: Sample, evidences: EvidenceConfig[]): boolean {
  if (evidences.length === 0) return true; // Se non c'è alcuna evidenza, ogni campione è accettato
  // Controlla che per ogni evidenza il valore nel campione corrisponda esattamente a quello richiesto
  return evidences.every(e => sample[e.var] === e.val);
}
