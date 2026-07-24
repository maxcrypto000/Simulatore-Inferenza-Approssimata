export interface Sample {
  ES: boolean; // Estate
  EG: boolean; // Egna (città)
  S: boolean;  // Sole
  L: boolean;  // Letto Presto
  A: boolean;  // Amici corrono
  C: boolean;  // Piero Corre
}

export interface EvidenceConfig {
  var: keyof Sample;
  val: boolean;
}

export function flipCoin(probability: number): boolean {
  return Math.random() < probability;
}

// Valori fittizi delle Conditional Probability Tables (CPT)
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

// C (Piero corre) dipende da L (Letto), A (Amici), S (Sole)
export const P_C_given_L_A_S = (L: boolean, A: boolean, S: boolean): number => {
  if (L && A && S) return 0.8;
  if (L && A && !S) return 0.5;
  if (L && !A && S) return 0.25;
  if (L && !A && !S) return 0.2;
  if (!L && A && S) return 0.35;
  if (!L && A && !S) return 0.3;
  if (!L && !A && S) return 0.01;
  // !L && !A && !S
  return 0.05;
};

/**
 * Genera un singolo campione per l'intera rete bayesiana, 
 * seguendo l'ordine topologico.
 */
export function generateSample(): Sample {
  const ES = flipCoin(P_ES);

  // Nodi figli di ES
  const EG = flipCoin(P_EG_given_ES[String(ES) as "true" | "false"]);
  const S = flipCoin(P_S_given_ES[String(ES) as "true" | "false"]);

  // Nodo figlio di EG
  const L = flipCoin(P_L_given_EG[String(EG) as "true" | "false"]);

  // Nodo figlio di S
  const A = flipCoin(P_A_given_S[String(S) as "true" | "false"]);

  // Nodo finale C
  const C = flipCoin(P_C_given_L_A_S(L, A, S));

  return { ES, EG, S, L, A, C };
}

/**
 * Valuta se il campione rispetta l'evidenza.
 * Ora accetta un array di evidenze (AND logico).
 */
export function isSampleAccepted(sample: Sample, evidences: EvidenceConfig[]): boolean {
  if (evidences.length === 0) return true;
  return evidences.every(e => sample[e.var] === e.val);
}
