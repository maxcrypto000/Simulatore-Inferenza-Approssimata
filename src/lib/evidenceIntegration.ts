/**
 * Motore matematico per l'algoritmo di Evidential Integration (Arc Reversal in Reti Bayesiane).
 * Implementa le operazioni di trasformazione su grafi orientati aciclici (DAG) e il ricalcolo dinamico
 * delle Conditional Probability Tables (CPT) tramite il Teorema di Bayes (algoritmo di Shachter).
 */

import { 
  EvidenceConfig,
  BayesNode,
  BayesCPT,
  BayesianNetwork,
  getCPTKey,
  generateAllAssignments,
  getProbability,
  getInitialPieroNetwork,
  getTopologicalOrder
} from './network';
import { generateDynamicLWSample } from './likelihoodWeighting';

// Riesportiamo le strutture e funzioni principali per comodità e retrocompatibilità
export type { BayesNode, BayesCPT, BayesianNetwork };
export { getInitialPieroNetwork, getTopologicalOrder, generateDynamicLWSample };

/**
 * ============================================================================
 * REQUISITO CORE: FUNZIONE reverseArc(network, nodeX, nodeY)
 * ============================================================================
 * Funzione pura che prende in input la rete e gli ID di due nodi (X -> Y, con X genitore di Y)
 * e restituisce una NUOVA rete con l'arco invertito (Y -> X) e le CPT ricalcolate.
 * 
 * Istruzioni Algoritmiche (Teorema di Shachter per Arc Reversal):
 * 1. Topologia: Trova Pa(X) e Pa(Y). Crea U = (Pa(X) U Pa(Y)) \ {X}.
 *    Nel nuovo grafo, Y avrà parents: U e X avrà parents: U U {Y}.
 * 2. Point-wise Product: Joint(X, Y | U) = OldCPT_X(X | Pa(X)) * OldCPT_Y(Y | X, Pa(Y)).
 * 3. Summing-Out: NewCPT_Y(Y | U) = Joint(X=true, Y | U) + Joint(X=false, Y | U).
 * 4. Bayes (Divisione): NewCPT_X(X | Y, U) = Joint(X, Y | U) / NewCPT_Y(Y | U).
 */
export function reverseArc(network: BayesianNetwork, nodeX: string, nodeY: string): BayesianNetwork {
  const oldNodeX = network.nodes.find(n => n.id === nodeX);
  const oldNodeY = network.nodes.find(n => n.id === nodeY);

  if (!oldNodeX || !oldNodeY) {
    throw new Error(`Nodi specificati per l'inversione (${nodeX} -> ${nodeY}) non trovati.`);
  }
  if (!oldNodeY.parents.includes(nodeX)) {
    throw new Error(`L'arco ${nodeX} -> ${nodeY} non esiste: ${nodeX} non è tra i genitori di ${nodeY}.`);
  }

  // 1. TOPOLOGIA: Calcolo dei nuovi insiemi di genitori
  const PaX = oldNodeX.parents;
  const PaY = oldNodeY.parents;
  
  // U = (Pa(X) U Pa(Y)) \ {X}
  const unionParents = new Set([...PaX, ...PaY]);
  unionParents.delete(nodeX);
  const U = Array.from(unionParents).sort();

  // Nuovi genitori per Y: U
  const newPaY = [...U].sort();
  // Nuovi genitori per X: U U {Y}
  const newPaX = [...U, nodeY].sort();

  // Creazione della nuova lista di nodi con la topologia aggiornata
  const newNodes: BayesNode[] = network.nodes.map(node => {
    if (node.id === nodeY) return { ...node, parents: newPaY };
    if (node.id === nodeX) return { ...node, parents: newPaX };
    return { ...node };
  });

  // 2. POINT-WISE PRODUCT helper: calcola la congiunta P(X=xVal, Y=yVal | U=uAssign) nel vecchio grafo
  const computeJoint = (xVal: boolean, yVal: boolean, uAssign: Record<string, boolean>): number => {
    const fullAssign = { ...uAssign, [nodeX]: xVal, [nodeY]: yVal };
    const pX = getProbability(network, nodeX, fullAssign, xVal);
    const pY = getProbability(network, nodeY, fullAssign, yVal);
    return pX * pY;
  };

  // 3. SUMMING-OUT: Calcolo della nuova CPT per Y: NewCPT_Y(Y | U) = sum_X Joint(X, Y | U)
  const newTableY: Record<string, number> = {};
  const uAssignments = generateAllAssignments(U);

  for (const uAssign of uAssignments) {
    const jointXTrueYTrue = computeJoint(true, true, uAssign);
    const jointXFalseYTrue = computeJoint(false, true, uAssign);
    const pYTrue = jointXTrueYTrue + jointXFalseYTrue;
    
    // Normalizzazione/clipping di sicurezza per evitare errori numerici di virgola mobile
    const clampedPYTrue = Math.max(0, Math.min(1, pYTrue));
    newTableY[getCPTKey(newPaY, uAssign)] = clampedPYTrue;
  }

  // 4. BAYES (DIVISIONE): Calcolo della nuova CPT per X: NewCPT_X(X | Y, U) = Joint(X, Y | U) / NewCPT_Y(Y | U)
  const newTableX: Record<string, number> = {};
  const xParentsAssignments = generateAllAssignments(newPaX); // assegnamenti di U e Y

  for (const paAssign of xParentsAssignments) {
    const yVal = paAssign[nodeY];
    const jointXTrue = computeJoint(true, yVal, paAssign);
    
    // Recuperiamo il denominatore P_new(Y = yVal | U) appena calcolato
    const keyY = getCPTKey(newPaY, paAssign);
    const pYTrue = newTableY[keyY];
    const denom = yVal ? pYTrue : (1.0 - pYTrue);

    let pXTrueGivenYAndU: number;
    if (denom < 1e-12) {
      // Caso di divisione per zero o evento condizionale impossibile -> fallback di sicurezza a 0.5
      pXTrueGivenYAndU = 0.5;
    } else {
      pXTrueGivenYAndU = jointXTrue / denom;
    }
    
    newTableX[getCPTKey(newPaX, paAssign)] = Math.max(0, Math.min(1, pXTrueGivenYAndU));
  }

  // Costruzione della nuova mappa di CPT
  const newCpts: Record<string, BayesCPT> = { ...network.cpts };
  newCpts[nodeY] = { nodeId: nodeY, table: newTableY };
  newCpts[nodeX] = { nodeId: nodeX, table: newTableX };

  return {
    nodes: newNodes,
    cpts: newCpts,
  };
}

/**
 * Verifica se l'inversione dell'arco P -> E creerebbe un ciclo orientato.
 * Per evitarlo, verifichiamo che non esistano ALTRI percorsi orientati da P a E oltre all'arco diretto.
 */
function canReverseArcWithoutCycle(network: BayesianNetwork, fromNode: string, toNode: string): boolean {
  // Eseguiamo una BFS partendo da fromNode, ignorando l'arco fromNode -> toNode
  const queue: string[] = [fromNode];
  const visited = new Set<string>([fromNode]);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === toNode) return false; // Esiste un altro percorso -> invertire creerebbe ciclo!

    // Trova tutti i figli di curr
    for (const node of network.nodes) {
      if (node.parents.includes(curr)) {
        if (curr === fromNode && node.id === toNode) continue; // Salta l'arco diretto che vogliamo invertire
        if (!visited.has(node.id)) {
          visited.add(node.id);
          queue.push(node.id);
        }
      }
    }
  }
  return true;
}

/**
 * Algoritmo di Evidential Integration per Likelihood Weighting.
 * Applica iterativamente l'inversione degli archi verso i nodi di evidenza finché
 * questi non diventano nodi radice (senza genitori), integrando le evidenze a priori.
 * 
 * @param network La rete bayesiana corrente
 * @param evidences Lista delle osservazioni di evidenza
 * @returns La rete trasformata e lo storico degli archi invertiti per la visualizzazione UI
 */
export function integrateEvidence(network: BayesianNetwork, evidences: EvidenceConfig[]): {
  network: BayesianNetwork;
  reversals: { from: string; to: string }[];
} {
  let currNet = network;
  const reversals: { from: string; to: string }[] = [];

  for (const ev of evidences) {
    const evNodeId = ev.var as string;
    let evNode = currNet.nodes.find(n => n.id === evNodeId);

    // Finchè il nodo di evidenza ha ancora genitori
    while (evNode && evNode.parents.length > 0) {
      // Troviamo un genitore il cui arco può essere invertito senza creare cicli
      let parentToReverse: string | null = null;
      for (const parentId of evNode.parents) {
        if (canReverseArcWithoutCycle(currNet, parentId, evNodeId)) {
          parentToReverse = parentId;
          break;
        }
      }

      if (!parentToReverse) {
        // Se tutti i genitori hanno percorsi multipli, invertiamo l'arco verso un antenato più alto prima
        parentToReverse = evNode.parents[0];
      }

      currNet = reverseArc(currNet, parentToReverse, evNodeId);
      reversals.push({ from: parentToReverse, to: evNodeId });
      evNode = currNet.nodes.find(n => n.id === evNodeId);
    }
  }

  return { network: currNet, reversals };
}
