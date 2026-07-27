'use client';

import React from 'react';
import { SimulationStats } from '../hooks/useRejectionSampling';
import { Sample, EvidenceConfig } from '../lib/network';
import styles from './Dashboard.module.css';

/**
 * Proprietà del cruscotto statistico di Rejection Sampling.
 */
interface DashboardProps {
  stats: SimulationStats;                                                       // Statistiche della simulazione
  queryVar: keyof Sample;                                                       // Variabile query (es. 'S' per Sole)
  queryVal: boolean;                                                            // Valore cercato per la query (true/false)
  evidences: EvidenceConfig[];                                                  // Lista delle evidenze impostate
  setConfig: (qVar: keyof Sample, qVal: boolean, evs: EvidenceConfig[]) => void;// Callback per modificare la configurazione
}

/**
 * Componente che visualizza le statistiche in tempo reale per il Rejection Sampling:
 * - Campioni totali generati
 * - Campioni scartati e percentuale di inefficienza
 * - Campioni accettati
 * - Stima della probabilità condizionata P(Query | Evidenze) con grafico a ciambella
 */
export default function Dashboard({ stats, queryVar, queryVal, evidences }: DashboardProps) {
  // Calcolo della percentuale di scarto (inefficienza dell'algoritmo)
  const rejectedRatio = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;

  // Calcolo della stima di probabilità: P(Query | Evidenze) = N(Query AND Evidenze) / N(Evidenze)
  const probabilityS = stats.accepted > 0 ? (stats.acceptedWithQuery / stats.accepted) : 0;
  const probabilityPercent = (probabilityS * 100).toFixed(1);

  // Calcoli geometrici per l'animazione della ciambella (SVG circle progress)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (probabilityS * circumference);

  // Costruisce una stringa leggibile delle evidenze (es. "C=V, S=F")
  const evidenceString = evidences.length === 0 ? "Nessuna" : evidences.map(e => `${e.var}=${e.val ? 'V' : 'F'}`).join(', ');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Cruscotto Statistico</h2>



      {/* Stima della probabilità condizionata e grafico a ciambella */}
      <div className={styles.probabilitySection}>
        <div className={styles.probInfo}>
          <h3>Stima P({queryVar}={queryVal ? 'V' : 'F'} | {evidenceString})</h3>
          <p>Campioni con {queryVar}={queryVal ? 'Vero' : 'Falso'} tra quelli accettati.</p>
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
            {/* Cerchio di progresso (stima percentuale) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#0ea5e9" // sky-500
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={styles.donutProgress}
            />
          </svg>
        </div>
      </div>

      {/* Grid delle schede statistiche (Contatori) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Totale Generati</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Rifiutati (Trash)</div>
          <div className={`${styles.statValue} ${styles.textRed}`}>{stats.rejected}</div>
          <div className={styles.statSub}>({rejectedRatio.toFixed(1)}%) - Inefficienza</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Accettati ({evidenceString})</div>
          <div className={`${styles.statValue} ${styles.textGreen}`}>{stats.accepted}</div>
        </div>
      </div>
    </div>
  );
}
