'use client';

import React from 'react';
import { Sample, EvidenceConfig } from '../lib/network';
import { Play, Pause, StepForward, RotateCcw, Plus, X } from 'lucide-react';
import styles from './SimulationBar.module.css';

/**
 * Proprietà della barra di controllo unificata per la simulazione e selezione di query ed evidenze.
 */
interface SimulationBarProps {
  queryVar: keyof Sample;
  queryVal: boolean;
  evidences: EvidenceConfig[];
  setConfig: (qVar: keyof Sample, qVal: boolean, evs: EvidenceConfig[]) => void;
  onGenerateSingle: () => void;
  onToggleAuto: () => void;
  onReset: () => void;
  isAutoGenerating: boolean;
  animState: string;
  isLW?: boolean;
}

const VARIABLES: (keyof Sample)[] = ['ES', 'EG', 'S', 'L', 'A', 'C'];

/**
 * Componente che raggruppa nella prima riga in alto:
 * 1. I pulsanti di azione (Genera 1 Campione, Auto 10x/sec, Reset)
 * 2. Il selettore di Query (Variabile = Valore)
 * 3. Il selettore dinamico delle Evidenze (con possibilità di aggiungere o rimuovere filtri)
 */
export default function SimulationBar({
  queryVar,
  queryVal,
  evidences,
  setConfig,
  onGenerateSingle,
  onToggleAuto,
  onReset,
  isAutoGenerating,
  animState,
  isLW = false,
}: SimulationBarProps) {
  /**
   * Aggiunge una nuova evidenza alla lista (se non sono state già aggiunte tutte le variabili).
   */
  const handleAddEvidence = () => {
    if (evidences.length >= VARIABLES.length) return;
    const availableVars = VARIABLES.filter(v => !evidences.find(e => e.var === v));
    if (availableVars.length > 0) {
      setConfig(queryVar, queryVal, [...evidences, { var: availableVars[0], val: true }]);
    }
  };

  /**
   * Rimuove un'evidenza in base all'indice.
   */
  const handleRemoveEvidence = (index: number) => {
    const newEvidences = evidences.filter((_, i) => i !== index);
    setConfig(queryVar, queryVal, newEvidences);
  };

  /**
   * Modifica la variabile o il valore booleano di una specifica evidenza.
   */
  const handleUpdateEvidence = (index: number, newVar: keyof Sample, newVal: boolean) => {
    const newEvidences = [...evidences];
    newEvidences[index] = { var: newVar, val: newVal };
    setConfig(queryVar, queryVal, newEvidences);
  };

  return (
    <div className={styles.barContainer}>
      {/* 1. Pulsanti di controllo della simulazione */}
      <div className={styles.actionButtons}>
        <button
          onClick={onGenerateSingle}
          disabled={isAutoGenerating || (animState !== 'idle' && animState !== 'done')}
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          <StepForward size={18} /> Genera 1 Campione
        </button>
        <button
          onClick={onToggleAuto}
          className={`${styles.btn} ${isAutoGenerating ? styles.btnDanger : styles.btnSuccess}`}
        >
          {isAutoGenerating ? (
            <><Pause size={18} /> Pausa (10x/sec)</>
          ) : (
            <><Play size={18} /> Auto 10x/sec</>
          )}
        </button>
        <button onClick={onReset} className={`${styles.btn} ${styles.btnSecondary}`}>
          <RotateCcw size={18} /> Reset
        </button>
      </div>

      {/* 2. Selettore di Query ed Evidenze inline sulla stessa barra accanto ai pulsanti */}
      <div className={styles.selectorsGroup}>
        {/* Selettore Query */}
        <div className={styles.selectorBox}>
          <span className={styles.label}>Query:</span>
          <select
            value={queryVar}
            onChange={(e) => setConfig(e.target.value as keyof Sample, queryVal, evidences)}
            className={styles.select}
          >
            {VARIABLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <span className={styles.equals}>=</span>
          <select
            value={queryVal ? 'true' : 'false'}
            onChange={(e) => setConfig(queryVar, e.target.value === 'true', evidences)}
            className={styles.select}
          >
            <option value="true">Vero</option>
            <option value="false">Falso</option>
          </select>
        </div>

        {/* Selettore Evidenze */}
        <div className={styles.selectorBox}>
          <span className={styles.label}>{isLW ? 'Evidenze (Fissate):' : 'Evidenze (Filtro):'}</span>
          {evidences.length === 0 && (
            <span className={styles.noEv}>Nessuna</span>
          )}
          {evidences.map((ev, index) => (
            <div key={index} className={styles.evidenceTag}>
              <select
                value={ev.var}
                onChange={(e) => handleUpdateEvidence(index, e.target.value as keyof Sample, ev.val)}
                className={styles.selectTag}
              >
                {VARIABLES.map(v => (
                  <option key={v} value={v} disabled={evidences.some((e, i) => e.var === v && i !== index)}>
                    {v}
                  </option>
                ))}
              </select>
              <span className={styles.equals}>=</span>
              <select
                value={ev.val ? 'true' : 'false'}
                onChange={(e) => handleUpdateEvidence(index, ev.var, e.target.value === 'true')}
                className={styles.selectTag}
              >
                <option value="true">V</option>
                <option value="false">F</option>
              </select>
              <button
                className={styles.btnRemove}
                onClick={() => handleRemoveEvidence(index)}
                title="Rimuovi Evidenza"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {evidences.length < VARIABLES.length && (
            <button className={styles.btnAdd} onClick={handleAddEvidence} title="Aggiungi Evidenza">
              <Plus size={14} /> Aggiungi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
