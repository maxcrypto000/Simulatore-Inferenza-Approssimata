import React from 'react';
import { LWStats } from '../hooks/useLikelihoodWeighting';
import { Sample, EvidenceConfig } from '../lib/network';
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
  isIntegrated?: boolean;                                                       // Flag che indica se Evidential Integration è attivo
  reversals?: { from: string; to: string }[];                                   // Storico degli archi invertiti
  applyEvidenceIntegration?: () => void;                                        // Funzione per applicare l'integrazione
  resetNetworkTopology?: () => void;                                            // Funzione per ripristinare la topologia
}

/**
 * Componente che visualizza le statistiche del Likelihood Weighting:
 * - Numero di iterazioni (tutti campioni utili, 0% scarto)
 * - Somma dei pesi totale W
 * - Somma dei pesi dove la query è verificata W_query
 * - Stima P(Query | Evidenze) = W_query / W
 */
export default function LWDashboard({ stats, queryVar, queryVal, evidences, isIntegrated, reversals, applyEvidenceIntegration, resetNetworkTopology }: LWDashboardProps) {
  // Calcolo della probabilità come media pesata: W_query / W_total
  const probabilityS = stats.totalWeight > 0 ? (stats.queryWeight / stats.totalWeight) : 0;
  const probabilityPercent = (probabilityS * 100).toFixed(1);

  // Parametri SVG per il grafico a ciambella
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (probabilityS * circumference);

  // Stringa riassuntiva per la visualizzazione delle evidenze attive
  const evidenceString = evidences.length === 0 ? "Nessuna" : evidences.map(e => `${e.var}=${e.val ? 'V' : 'F'}`).join(', ');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Cruscotto LW</h2>

      {/* Sezione Evidential Integration (Arc Reversal / Shachter) */}
      <div className={styles.configSection} style={{ border: isIntegrated ? '1px solid #00e5ff' : '1px solid #475569', background: isIntegrated ? 'rgba(0, 229, 255, 0.08)' : 'rgba(30, 41, 59, 0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: isIntegrated ? '#00e5ff' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ Evidential Integration (Arc Reversal)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              {isIntegrated
                ? 'Algoritmo di Shachter applicato: i nodi di evidenza sono diventati radici invertendo gli archi.'
                : 'Inverti dinamicamente gli archi verso le evidenze per integrare le informazioni a priori nelle CPT.'}
            </p>
          </div>
          <div>
            {!isIntegrated ? (
              <button
                onClick={applyEvidenceIntegration}
                style={{
                  background: 'linear-gradient(135deg, #00e5ff 0%, #0088ff 100%)',
                  color: '#0f172a',
                  fontWeight: 'bold',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 229, 255, 0.4)',
                  transition: 'transform 0.2s',
                }}
              >
                Applica Evidential Integration
              </button>
            ) : (
              <button
                onClick={resetNetworkTopology}
                style={{
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  fontWeight: '600',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Reset Rete Originale
              </button>
            )}
          </div>
        </div>

        {isIntegrated && reversals && reversals.length > 0 && (
          <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', fontSize: '0.85rem', color: '#cbd5e1', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            🔴 Archi invertiti (<strong style={{ color: '#ef4444' }}>rossi</strong>):
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {reversals.map((rev, idx) => (
                <span key={idx} style={{ background: 'rgba(0, 229, 255, 0.15)', border: '1px solid #00e5ff', padding: '4px 10px', borderRadius: '6px', color: '#00e5ff', fontWeight: '500' }}>
                  {rev.from} ➔ {rev.to} <small style={{ color: '#94a3b8' }}>(ora {rev.to} ➔ {rev.from})</small>
                </span>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#3b82f6' }}>
              ℹ️ Gli eventuali archi <strong>blu </strong> indicano le nuove dipendenze (eredità dei genitori congiunti) create durante l&apos;inversione secondo l&apos;algoritmo di Shachter.
            </div>
          </div>
        )}
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
