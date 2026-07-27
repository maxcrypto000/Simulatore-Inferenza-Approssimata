/**
 * Definizione della struttura di un campione (Sample) nella Rete Bayesiana.
 * Ogni variabile booleana rappresenta un evento del dominio applicativo.
 */
export interface Sample {
  ES: boolean; // Estate: indica se ci troviamo nella stagione estiva (Vero/Falso)
  EG: boolean; // Egna (città): indica se Piero si trova ad Egna (Vero/Falso)
  S: boolean;  // Sole: indica se è una giornata soleggiata (Vero/Falso)
  L: boolean;  // Letto Presto: indica se Piero è andato a letto presto la sera precedente (Vero/Falso)
  A: boolean;  // Amici corrono: indica se gli amici di Piero sono andati a correre (Vero/Falso)
  C: boolean;  // Piero Corre: variabile target (evento finale), indica se Piero va a correre (Vero/Falso)
}

/**
 * Configurazione di una singola evidenza (osservazione/filtro).
 * Specifica quale variabile (var) deve assumere un determinato valore booleano (val).
 */
export interface EvidenceConfig {
  var: keyof Sample;
  val: boolean;
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
 * TABELLE DELLE PROBABILITÀ CONDIZIONATE (CPT - Conditional Probability Tables)
 * ============================================================================
 * Definiscono le probabilità a priori e condizionate per ogni nodo della rete.
 */

// Probabilità a priori del nodo radice ES (Estate): P(ES = true) = 0.25 (25% di probabilità che sia estate)
export const P_ES = 0.25;

// CPT del nodo EG (Egna), dipendente dal nodo genitore ES (Estate): P(EG | ES)
// Se è estate (ES = true), la probabilità di essere ad Egna è 0.1 (10%)
// Se non è estate (ES = false), la probabilità di essere ad Egna è 0.3 (30%)
export const P_EG_given_ES = {
  true: 0.1,
  false: 0.3,
};

// CPT del nodo S (Sole), dipendente dal nodo genitore ES (Estate): P(S | ES)
// Se è estate (ES = true), c'è l'80% di probabilità di sole
// Se non è estate (ES = false), c'è il 40% di probabilità di sole
export const P_S_given_ES = {
  true: 0.8,
  false: 0.4,
};

// CPT del nodo L (Letto Presto), dipendente dal genitore EG (Egna): P(L | EG)
// Se Piero è ad Egna (EG = true), va a letto presto il 90% delle volte
// Se non è ad Egna (EG = false), va a letto presto il 60% delle volte
export const P_L_given_EG = {
  true: 0.9,
  false: 0.6,
};

// CPT del nodo A (Amici corrono), dipendente dal genitore S (Sole): P(A | S)
// Se c'è sole (S = true), gli amici corrono nel 60% dei casi
// Se non c'è sole (S = false), gli amici corrono solo nel 25% dei casi
export const P_A_given_S = {
  true: 0.6,
  false: 0.25,
};

/**
 * CPT del nodo C (Piero corre), dipendente da tre genitori: L (Letto Presto), A (Amici), S (Sole).
 * Calcola e restituisce la probabilità P(C=true | L, A, S) in base alle combinazioni dei genitori.
 * 
 * @param L Stato della variabile "Letto Presto"
 * @param A Stato della variabile "Amici corrono"
 * @param S Stato della variabile "Sole"
 * @returns Probabilità condizionata che Piero vada a correre P(C=true | L, A, S)
 */
export const P_C_given_L_A_S = (L: boolean, A: boolean, S: boolean): number => {
  if (L && A && S) return 0.8;    // Condizioni ideali: dormito bene, amici corrono, c'è sole -> 80%
  if (L && A && !S) return 0.5;   // Dormito bene e amici corrono, ma niente sole -> 50%
  if (L && !A && S) return 0.25;  // Dormito bene e sole, ma da solo (niente amici) -> 25%
  if (L && !A && !S) return 0.2;  // Dormito bene, ma da solo e senza sole -> 20%
  if (!L && A && S) return 0.35;  // Stanco (!L), ma trascinato da amici e sole -> 35%
  if (!L && A && !S) return 0.3;  // Stanco (!L), con amici ma senza sole -> 30%
  if (!L && !A && S) return 0.01; // Stanco (!L), da solo e con sole -> 1% (quasi impossibile)
  // !L && !A && !S
  return 0.05;                    // Pessime condizioni: stanco, solo, brutto tempo -> 5%
};

/**
 * Genera un singolo campione casuale per l'intera rete bayesiana (Prior Sampling), 
 * procedendo scrupolosamente secondo l'ordine topologico dei nodi (da genitori a figli).
 * 
 * Ordine topologico utilizzato:
 * 1. ES (radice)
 * 2. EG e S (figli di ES)
 * 3. L (figlio di EG) e A (figlio di S)
 * 4. C (figlio di L, A e S)
 * 
 * @returns Un oggetto Sample contenente i valori generati per tutti i nodi della rete
 */
export function generateSample(): Sample {
  // 1. Campionamento del nodo radice ES (Estate)
  const ES = flipCoin(P_ES);

  // 2. Campionamento dei nodi figli di ES: EG (Egna) e S (Sole)
  const EG = flipCoin(P_EG_given_ES[String(ES) as "true" | "false"]);
  const S = flipCoin(P_S_given_ES[String(ES) as "true" | "false"]);

  // 3. Campionamento dei nodi di livello 2: L (Letto presto) da EG e A (Amici) da S
  const L = flipCoin(P_L_given_EG[String(EG) as "true" | "false"]);
  const A = flipCoin(P_A_given_S[String(S) as "true" | "false"]);

  // 4. Campionamento del nodo finale (foglia) C (Piero corre), dipendente da L, A e S
  const C = flipCoin(P_C_given_L_A_S(L, A, S));

  return { ES, EG, S, L, A, C };
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
