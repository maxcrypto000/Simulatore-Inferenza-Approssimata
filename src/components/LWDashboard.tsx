import React from 'react';
import { LWStats } from '../hooks/useLikelihoodWeighting';
import { Sample, EvidenceConfig } from '../lib/inference';
import { Plus, X } from 'lucide-react';
import styles from './Dashboard.module.css';

/**
 * Proprietà per il cruscotto statistico della modalità Likelihood Weighting.
 */
interface LWDashboardProps {
  stats: LWStats;                                                               // Statistiche di pesatura (iterazioni, pesi totali)
  queryVar: keyof Sample;                                                       // Variabile query (es. 'S')
  queryVal: boolean;                                                            // Valore richiesto per la query
  evidences: EvidenceConfig[];                                                  // Evidenze forzate
  setConfig: (qVar: keyof Sample, qVal: boolean, evs: EvidenceConfig[]) => void;// Callback di configurazione
}

const VARIABLES: (keyof Sample)[] = ['ES', 'EG', 'S', 'L', 'A', 'C'];

/**
 * Componente che visualizza le statistiche del Likelihood Weighting:
 * - Numero di iterazioni (tutti campioni utili, 0% scarto)
 * - Somma dei pesi totale W
 * - Somma dei pesi dove la query è verificata W_query
 * - Stima P(Query | Evidenze) = W_query / W
 */
export default function LWDashboard({ stats, queryVar, queryVal, evidences, setConfig }: LWDashboardProps) {
  // Calcolo della probabilità come media pesata: W_query / W_total
  const probabilityS = stats.totalWeight > 0 ? (stats.queryWeight / stats.totalWeight) : 0;
  const probabilityPercent = (probabilityS * 100).toFixed(1);

  // Parametri SVG per il grafico a ciambella
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (probabilityS * circumference);

  /**
   * Aggiunge un nuovo vincolo di evidenza alla lista.
   */
  const handleAddEvidence = () => {
    if (evidences.length >= VARIABLES.length) return;
    const availableVars = VARIABLES.filter(v => !evidences.find(e => e.var === v));
    if (availableVars.length > 0) {
      setConfig(queryVar, queryVal, [...evidences, { var: availableVars[0], val: true }]);
    }
  };

  /**
   * Rimuove un vincolo di evidenza.
   */
  const handleRemoveEvidence = (index: number) => {
    const newEvidences = evidences.filter((_, i) => i !== index);
    setConfig(queryVar, queryVal, newEvidences);
  };

  /**
   * Aggiorna una specifica evidenza nella lista.
   */
  const handleUpdateEvidence = (index: number, newVar: keyof Sample, newVal: boolean) => {
    const newEvidences = [...evidences];
    newEvidences[index] = { var: newVar, val: newVal };
    setConfig(queryVar, queryVal, newEvidences);
  };

  // Stringa riassuntiva per la visualizzazione delle evidenze attive
  const evidenceString = evidences.length === 0 ? "Nessuna" : evidences.map(e => `${e.var}=${e.val ? 'V' : 'F'}`).join(', ');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Cruscotto LW</h2>
      
      {/* Sezione per impostare Query e Evidenze (Filtro forzato) */}
      <div className={styles.configSection}>
        <h3>Impostazioni Simulazione (LW)</h3>
        <div className={styles.configGrid}>
          {/* Selettore Query */}
          <div className={styles.configGroup}>
            <label>Query Evento:</label>
            <div className={styles.configInputs}>
              <select value={queryVar} onChange={(e) => setConfig(e.target.value as keyof Sample, queryVal, evidences)}>
                {VARIABLES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <span> = </span>
              <select value={queryVal ? 'true' : 'false'} onChange={(e) => setConfig(queryVar, e.target.value === 'true', evidences)}>
                <option value="true">Vero</option>
                <option value="false">Falso</option>
              </select>
            </div>
          </div>
          
          {/* Lista Evidenze */}
          <div className={styles.configGroup}>
            <label className={styles.evidenceHeader}>
              Evidenze (Filtro forzato):
              {evidences.length < VARIABLES.length && (
                <button className={styles.btnAdd} onClick={handleAddEvidence} title="Aggiungi Evidenza">
                  <Plus size={14} />
                </button>
              )}
            </label>
            <div className={styles.evidenceList}>
              {evidences.length === 0 && <div className={styles.noEvidence}>Nessun filtro (accetta tutto)</div>}
              {evidences.map((ev, index) => (
                <div key={index} className={styles.configInputs}>
                  <select 
                    value={ev.var} 
                    onChange={(e) => handleUpdateEvidence(index, e.target.value as keyof Sample, ev.val)}
                  >
                    {VARIABLES.map(v => (
                      <option key={v} value={v} disabled={evidences.some((e, i) => e.var === v && i !== index)}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <span> = </span>
                  <select 
                    value={ev.val ? 'true' : 'false'} 
                    onChange={(e) => handleUpdateEvidence(index, ev.var, e.target.value === 'true')}
                  >
                    <option value="true">Vero</option>
                    <option value="false">Falso</option>
                  </select>
                  <button className={styles.btnRemove} onClick={() => handleRemoveEvidence(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid delle schede con i contatori dei Pesi */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Iterazioni</div>
          <div className={styles.statValue}>{stats.iterations}</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Somma Pesi Totale</div>
          <div className={`${styles.statValue} ${styles.textGreen}`}>{stats.totalWeight.toFixed(2)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Somma Pesi ({queryVar}={queryVal ? 'V' : 'F'})</div>
          <div className={`${styles.statValue} ${styles.textGreen}`}>{stats.queryWeight.toFixed(2)}</div>
        </div>
      </div>

      {/* Sezione probabilità stimata e grafico SVG */}
      <div className={styles.probabilitySection}>
        <div className={styles.probInfo}>
          <h3>Stima P({queryVar}={queryVal ? 'V' : 'F'} | {evidenceString})</h3>
          <p>Somma dei pesi con {queryVar}={queryVal ? 'Vero' : 'Falso'} / Somma totale dei pesi.</p>
          <div className={styles.probValue}>{probabilityPercent}%</div>
        </div>

        <div className={styles.donutContainer}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            {/* Cerchio di sfondo */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#334155"
              strokeWidth="8"
            />
            {/* Cerchio di progresso */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#eab308" // yellow-500
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={styles.donutProgress}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
