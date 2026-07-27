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

/**
 * Risultato della generazione di un singolo campione tramite Likelihood Weighting.
 */
export interface LWSampleResult {
  sample: Sample;                                      // Il campione completo (con nodi evidenza fissati)
  weight: number;                                      // Il peso globale w calcolato come prodotto delle probabilità delle evidenze
  stepWeights: Partial<Record<keyof Sample, number>>;  // Dettaglio dei moltiplicatori di peso per singolo nodo (per visualizzazione UI)
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
 * @param evidences Lista delle evidenze (es. [{ var: 'C', val: true }])
 * @returns Il campione generato, il peso totale calcolato e i pesi intermedi per l'animazione
 */
export function generateLWSample(evidences: EvidenceConfig[]): LWSampleResult {
  let weight = 1.0; // Inizializzazione del peso del campione a 1.0
  const stepWeights: Partial<Record<keyof Sample, number>> = {};
  
  /**
   * Funzione ausiliaria per verificare se una variabile è una variabile di evidenza e recuperarne il valore richiesto.
   */
  const getEvidenceVal = (nodeId: keyof Sample): boolean | undefined => {
    const ev = evidences.find(e => e.var === nodeId);
    return ev ? ev.val : undefined;
  };

  /* --------------------------------------------------------------------------
   * 1. NODO RADICE: ES (Estate)
   * -------------------------------------------------------------------------- */
  const ES_ev = getEvidenceVal('ES');
  let ES: boolean;
  if (ES_ev !== undefined) {
    // Il nodo è una variabile di evidenza -> fissiamo il valore e aggiorniamo il peso
    ES = ES_ev;
    const p = ES ? P_ES : (1 - P_ES);
    weight *= p;
    stepWeights['ES'] = p;
  } else {
    // Il nodo non è in evidenza -> campioniamo normalmente dalla probabilità a priori P(ES)
    ES = flipCoin(P_ES);
  }

  /* --------------------------------------------------------------------------
   * 2. NODO FIGLIO: EG (Egna), dipendente da ES
   * -------------------------------------------------------------------------- */
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

  /* --------------------------------------------------------------------------
   * 3. NODO FIGLIO: S (Sole), dipendente da ES
   * -------------------------------------------------------------------------- */
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

  /* --------------------------------------------------------------------------
   * 4. NODO DI LIVELLO 2: L (Letto Presto), dipendente da EG
   * -------------------------------------------------------------------------- */
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

  /* --------------------------------------------------------------------------
   * 5. NODO DI LIVELLO 2: A (Amici corrono), dipendente da S
   * -------------------------------------------------------------------------- */
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

  /* --------------------------------------------------------------------------
   * 6. NODO FOGLIA: C (Piero corre), dipendente da L, A, S
   * -------------------------------------------------------------------------- */
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

  // Restituisce il campione con il suo peso finale accumulato e i singoli pesi di step
  return {
    sample: { ES, EG, S, L, A, C },
    weight,
    stepWeights
  };
}
