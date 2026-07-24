import { 
  Sample, 
  EvidenceConfig,
  flipCoin, 
  P_ES, 
  P_EG_given_ES, 
  P_S_given_ES, 
  P_L_given_EG, 
  P_A_given_S, 
  P_C_given_L_A_S 
} from './inference';

export interface LWSampleResult {
  sample: Sample;
  weight: number;
  stepWeights: Partial<Record<keyof Sample, number>>;
}

/**
 * Genera un campione usando Likelihood Weighting in base alle evidenze fornite.
 */
export function generateLWSample(evidences: EvidenceConfig[]): LWSampleResult {
  let weight = 1.0;
  const stepWeights: Partial<Record<keyof Sample, number>> = {};
  
  const getEvidenceVal = (nodeId: keyof Sample): boolean | undefined => {
    const ev = evidences.find(e => e.var === nodeId);
    return ev ? ev.val : undefined;
  };

  // Node ES
  const ES_ev = getEvidenceVal('ES');
  let ES: boolean;
  if (ES_ev !== undefined) {
    ES = ES_ev;
    const p = ES ? P_ES : (1 - P_ES);
    weight *= p;
    stepWeights['ES'] = p;
  } else {
    ES = flipCoin(P_ES);
  }

  // Node EG
  const EG_ev = getEvidenceVal('EG');
  let EG: boolean;
  const pEG = P_EG_given_ES[String(ES) as "true" | "false"];
  if (EG_ev !== undefined) {
    EG = EG_ev;
    const p = EG ? pEG : (1 - pEG);
    weight *= p;
    stepWeights['EG'] = p;
  } else {
    EG = flipCoin(pEG);
  }

  // Node S
  const S_ev = getEvidenceVal('S');
  let S: boolean;
  const pS = P_S_given_ES[String(ES) as "true" | "false"];
  if (S_ev !== undefined) {
    S = S_ev;
    const p = S ? pS : (1 - pS);
    weight *= p;
    stepWeights['S'] = p;
  } else {
    S = flipCoin(pS);
  }

  // Node L
  const L_ev = getEvidenceVal('L');
  let L: boolean;
  const pL = P_L_given_EG[String(EG) as "true" | "false"];
  if (L_ev !== undefined) {
    L = L_ev;
    const p = L ? pL : (1 - pL);
    weight *= p;
    stepWeights['L'] = p;
  } else {
    L = flipCoin(pL);
  }

  // Node A
  const A_ev = getEvidenceVal('A');
  let A: boolean;
  const pA = P_A_given_S[String(S) as "true" | "false"];
  if (A_ev !== undefined) {
    A = A_ev;
    const p = A ? pA : (1 - pA);
    weight *= p;
    stepWeights['A'] = p;
  } else {
    A = flipCoin(pA);
  }

  // Node C
  const C_ev = getEvidenceVal('C');
  let C: boolean;
  const pC = P_C_given_L_A_S(L, A, S);
  if (C_ev !== undefined) {
    C = C_ev;
    const p = C ? pC : (1 - pC);
    weight *= p;
    stepWeights['C'] = p;
  } else {
    C = flipCoin(pC);
  }

  return {
    sample: { ES, EG, S, L, A, C },
    weight,
    stepWeights
  };
}
