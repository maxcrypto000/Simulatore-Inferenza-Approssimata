/**
 * Definizione della struttura, della topologia dinamica e delle Tabelle di Probabilità
 * Condizionata (CPT) della Rete Bayesiana di default.
 * 
 * Questo modulo funge da sorgente unica di verità (Single Source of Truth) per tutti gli algoritmi
 * di inferenza (Rejection Sampling, Likelihood Weighting, Evidential Integration).
 * Utilizza strutture dati generali per grafi orientati aciclici (DAG) e CPT canoniche.
 */

/**
 * Definizione della struttura di un campione (Sample) nella Rete Bayesiana.
 * Ogni variabile booleana rappresenta un evento del dominio applicativo.
 */
export type Sample = Record<string, boolean>;

/**
 * Configurazione di una singola evidenza (osservazione/filtro).
 * Specifica quale variabile (var) deve assumere un determinato valore booleano (val).
 */
export interface EvidenceConfig {
  var: string;
  val: boolean;
}

/**
 * Struttura di un nodo della Rete Bayesiana dinamica.
 */
export interface BayesNode {
  id: string;        // Identificativo univoco del nodo (es. 'ES', 'EG', 'S', 'L', 'A', 'C')
  type: 'boolean';   // Tipo di variabile (booleana nel nostro dominio)
  parents: string[]; // Array di ID dei nodi genitori (ordinato alfabeticamente per canonicità)
  label?: string;    // Etichetta visuale per il grafico
  x?: number;        // Posizione x nel grafico
  y?: number;        // Posizione y nel grafico
}

/**
 * Tabella delle probabilità condizionate (CPT) per un nodo.
 * La tabella mappa la stringa chiave dell'assegnamento dei genitori (es. "A:1|L:0|S:1")
 * alla probabilità che il nodo sia VERO: P(Nodo = true | Genitori).
 */
export interface BayesCPT {
  nodeId: string;
  table: Record<string, number>;
}

/**
 * Definizione completa di una Rete Bayesiana dinamica.
 */
export interface BayesianNetwork {
  nodes: BayesNode[];
  cpts: Record<string, BayesCPT>; // Mappa nodeId -> BayesCPT
}

/**
 * Funzione ausiliaria che simula il lancio di una moneta truccata (riferita a una probabilità data).
 * Restituisce true con probabilità `probability` e false con probabilità `1 - probability`.
 * 
 * @param probability Probabilità dell'evento (numero compreso tra 0 e 1)
 * @returns Esito del campionamento booleano
 */
export function flipCoin(probability: number): boolean {
  return Math.random() < probability;
}

/* ============================================================================
 * UTILITY PER LE TABELLE DI PROBABILITÀ CONDIZIONATA (CPT) E TOPOLOGIA
 * ============================================================================ */

/**
 * Calcola la chiave canonica della CPT per un dato assegnamento di un insieme di variabili genitori.
 * 
 * @param parents Lista di ID dei genitori
 * @param assignment Assegnamento booleano corrente { A: true, B: false, ... }
 * @returns Stringa chiave ordinata alfabeticamente (es. "A:1|B:0")
 */
export function getCPTKey(parents: string[], assignment: Record<string, boolean>): string {
  if (parents.length === 0) return '';
  const sorted = [...parents].sort();
  return sorted.map(p => `${p}:${assignment[p] ? '1' : '0'}`).join('|');
}

/**
 * Genera ricorsivamente tutte le combinazioni (assegnamenti booleani $2^n$) per un set di variabili.
 * 
 * @param variables Array di nomi di variabili
 * @returns Array di oggetti assegnamento
 */
export function generateAllAssignments(variables: string[]): Record<string, boolean>[] {
  if (variables.length === 0) return [{}];
  const sortedVars = [...variables].sort();
  const [first, ...rest] = sortedVars;
  const restAssignments = generateAllAssignments(rest);
  const result: Record<string, boolean>[] = [];
  for (const assign of restAssignments) {
    result.push({ ...assign, [first]: true });
    result.push({ ...assign, [first]: false });
  }
  return result;
}

/**
 * Restituisce la probabilità P(nodeId = val | assignment) consultando la CPT dinamica della rete.
 * 
 * @param network La rete bayesiana da consultare
 * @param nodeId L'ID del nodo da valutare
 * @param assignment Valori attuali dei nodi della rete
 * @param val Valore booleano richiesto per nodeId (default: true)
 * @returns Probabilità numerica [0, 1]
 */
export function getProbability(network: BayesianNetwork, nodeId: string, assignment: Record<string, boolean>, val: boolean = true): number {
  const node = network.nodes.find(n => n.id === nodeId);
  if (!node) throw new Error(`Nodo ${nodeId} non trovato nella rete.`);
  const cpt = network.cpts[nodeId];
  if (!cpt) throw new Error(`CPT per il nodo ${nodeId} non trovata.`);
  
  const key = getCPTKey(node.parents, assignment);
  const pTrue = cpt.table[key];
  if (pTrue === undefined) {
    throw new Error(`Chiave CPT '${key}' non trovata per il nodo ${nodeId}.`);
  }
  return val ? pTrue : (1.0 - pTrue);
}

/**
 * Calcola l'ordine topologico dei nodi di una rete bayesiana dinamica utilizzando l'algoritmo di Kahn.
 * Assicura che ogni nodo venga visitato solo dopo che tutti i suoi genitori sono stati processati.
 * 
 * @param network La rete bayesiana da ordinare
 * @returns Array di ID dei nodi in ordine topologico
 */
export function getTopologicalOrder(network: BayesianNetwork): string[] {
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const node of network.nodes) {
    inDegree[node.id] = node.parents.length;
    adj[node.id] = [];
  }

  for (const node of network.nodes) {
    for (const p of node.parents) {
      if (!adj[p]) adj[p] = [];
      adj[p].push(node.id);
    }
  }

  const queue: string[] = [];
  for (const id in inDegree) {
    if (inDegree[id] === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);
    for (const child of (adj[curr] || [])) {
      inDegree[child]--;
      if (inDegree[child] === 0) queue.push(child);
    }
  }

  return order.length === network.nodes.length ? order : network.nodes.map(n => n.id);
}

/* ============================================================================
 * VALORI DI DEFAULT DELLA RETE (CPT DI PARTENZA)
 * ============================================================================ */

export const P_ES = 0.25;

export const P_EG_given_ES = {
  true: 0.1,
  false: 0.3,
};

export const P_S_given_ES = {
  true: 0.8,
  false: 0.4,
};

export const P_L_given_EG = {
  true: 0.9,
  false: 0.6,
};

export const P_A_given_S = {
  true: 0.6,
  false: 0.25,
};

export const P_C_given_L_A_S = (L: boolean, A: boolean, S: boolean): number => {
  if (L && A && S) return 0.8;    // Condizioni ideali: dormito bene, amici corrono, c'è sole -> 80%
  if (L && A && !S) return 0.5;   // Dormito bene e amici corrono, ma niente sole -> 50%
  if (L && !A && S) return 0.25;  // Dormito bene e sole, ma da solo (niente amici) -> 25%
  if (L && !A && !S) return 0.2;  // Dormito bene, ma da solo e senza sole -> 20%
  if (!L && A && S) return 0.35;  // Stanco (!L), ma trascinato da amici e sole -> 35%
  if (!L && A && !S) return 0.3;  // Stanco (!L), con amici ma senza sole -> 30%
  if (!L && !A && S) return 0.01; // Stanco (!L), da solo e con sole -> 1% (quasi impossibile)
  return 0.05;                    // Pessime condizioni: stanco, solo, brutto tempo -> 5%
};

/**
 * Restituisce la Rete Bayesiana iniziale formalizzata nella struttura dati dinamica.
 * Genera le CPT complete per tutti i nodi.
 * 
 * @returns Oggetto BayesianNetwork con nodi ordinati e tabelle di probabilità
 */
export function getDefaultNetwork(): BayesianNetwork {
  const nodes: BayesNode[] = [
    { id: 'ES', type: 'boolean', parents: [], label: 'Estate', x: 300, y: 40 },
    { id: 'EG', type: 'boolean', parents: ['ES'], label: 'Egna', x: 150, y: 140 },
    { id: 'S',  type: 'boolean', parents: ['ES'], label: 'Sole', x: 450, y: 140 },
    { id: 'L',  type: 'boolean', parents: ['EG'], label: 'Letto Presto', x: 150, y: 240 },
    { id: 'A',  type: 'boolean', parents: ['S'], label: 'Amici Corrono', x: 450, y: 240 },
    { id: 'C',  type: 'boolean', parents: ['A', 'L', 'S'], label: 'Corsa', x: 300, y: 340 },
  ];

  const cpts: Record<string, BayesCPT> = {
    ES: {
      nodeId: 'ES',
      table: { '': P_ES },
    },
    EG: {
      nodeId: 'EG',
      table: {
        'ES:1': P_EG_given_ES.true,
        'ES:0': P_EG_given_ES.false,
      },
    },
    S: {
      nodeId: 'S',
      table: {
        'ES:1': P_S_given_ES.true,
        'ES:0': P_S_given_ES.false,
      },
    },
    L: {
      nodeId: 'L',
      table: {
        'EG:1': P_L_given_EG.true,
        'EG:0': P_L_given_EG.false,
      },
    },
    A: {
      nodeId: 'A',
      table: {
        'S:1': P_A_given_S.true,
        'S:0': P_A_given_S.false,
      },
    },
    C: {
      nodeId: 'C',
      table: {},
    },
  };

  // Popoliamo dinamicamente la CPT iniziale del nodo C (che ha 3 genitori: A, L, S)
  const cParents = ['A', 'L', 'S'].sort();
  const cAssignments = generateAllAssignments(cParents);
  for (const assign of cAssignments) {
    const p = P_C_given_L_A_S(assign.L, assign.A, assign.S);
    cpts.C.table[getCPTKey(cParents, assign)] = p;
  }

  return { nodes, cpts };
}
