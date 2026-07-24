'use client';

import React from 'react';
import { SimulationStats } from '../hooks/useRejectionSampling';
import { Sample, EvidenceConfig } from '../lib/inference';
import { Plus, X } from 'lucide-react';
import styles from './Dashboard.module.css';

interface DashboardProps {
  stats: SimulationStats;
  queryVar: keyof Sample;
  queryVal: boolean;
  evidences: EvidenceConfig[];
  setConfig: (qVar: keyof Sample, qVal: boolean, evs: EvidenceConfig[]) => void;
}

const VARIABLES: (keyof Sample)[] = ['ES', 'EG', 'S', 'L', 'A', 'C'];

export default function Dashboard({ stats, queryVar, queryVal, evidences, setConfig }: DashboardProps) {
  const rejectedRatio = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;
  
  // P(Query | Evidence)
  const probabilityS = stats.accepted > 0 ? (stats.acceptedWithQuery / stats.accepted) : 0;
  const probabilityPercent = (probabilityS * 100).toFixed(1);

  // For the donut chart SVG
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (probabilityS * circumference);

  const handleAddEvidence = () => {
    if (evidences.length >= VARIABLES.length) return;
    const availableVars = VARIABLES.filter(v => !evidences.find(e => e.var === v));
    if (availableVars.length > 0) {
      setConfig(queryVar, queryVal, [...evidences, { var: availableVars[0], val: true }]);
    }
  };

  const handleRemoveEvidence = (index: number) => {
    const newEvidences = evidences.filter((_, i) => i !== index);
    setConfig(queryVar, queryVal, newEvidences);
  };

  const handleUpdateEvidence = (index: number, newVar: keyof Sample, newVal: boolean) => {
    const newEvidences = [...evidences];
    newEvidences[index] = { var: newVar, val: newVal };
    setConfig(queryVar, queryVal, newEvidences);
  };

  const evidenceString = evidences.length === 0 ? "Nessuna" : evidences.map(e => `${e.var}=${e.val ? 'V' : 'F'}`).join(', ');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Cruscotto Statistico</h2>
      
      <div className={styles.configSection}>
        <h3>Impostazioni Simulazione</h3>
        <div className={styles.configGrid}>
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
          <div className={styles.configGroup}>
            <label className={styles.evidenceHeader}>
              Evidenze (Filtro):
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

      <div className={styles.probabilitySection}>
        <div className={styles.probInfo}>
          <h3>Stima P({queryVar}={queryVal ? 'V' : 'F'} | {evidenceString})</h3>
          <p>Campioni con {queryVar}={queryVal ? 'Vero' : 'Falso'} tra quelli accettati.</p>
          <div className={styles.probValue}>{probabilityPercent}%</div>
        </div>

        <div className={styles.donutContainer}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#334155"
              strokeWidth="8"
            />
            {/* Progress circle */}
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
    </div>
  );
}
