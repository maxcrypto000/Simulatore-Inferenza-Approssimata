'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationState } from '../hooks/useRejectionSampling';
import { isSampleAccepted } from '../lib/inference';
import { Sample, EvidenceConfig } from '../lib/network';
import styles from './RejectionGate.module.css';

/**
 * Proprietà del componente RejectionGate.
 */
interface RejectionGateProps {
  sample: Sample | null;      // Campione in transito
  animState: AnimationState;  // Stato dell'animazione
  isAutoGenerating: boolean;  // Modalità veloce attiva/disattiva
  evidences: EvidenceConfig[] // Evidenze imposte come filtro
}

/**
 * Componente visivo che rappresenta il "Gate di Rejection" (o Filtro di Accettazione/Rifiuto).
 * In questo passaggio il campione generato viene confrontato con le evidenze osservate:
 * - Se soddisfa TUTTE le evidenze, il gate si illumina di VERDE e il campione scivola nel cesto "Accettati".
 * - Se viola ANCHE UNA SOLA evidenza, il gate si illumina di ROSSO e il campione viene gettato nel cesto "Trash".
 */
export default function RejectionGate({ sample, animState, isAutoGenerating, evidences }: RejectionGateProps) {
  
  // Determina se il campione attuale è accettato dal filtro
  const accepted = sample ? isSampleAccepted(sample, evidences) : null;
  
  // Impostazione del colore e del bagliore del gate in base all'esito del test
  let gateColor = '#334155'; // colore di default (slate-700)
  let gateGlow = 'none';

  if (sample && (animState === 'evaluating' || animState === 'routing' || animState === 'done')) {
    if (accepted) {
      gateColor = '#22c55e'; // verde per campione valido
      gateGlow = '0 0 20px #22c55e';
    } else {
      gateColor = '#ef4444'; // rosso per campione scartato
      gateGlow = '0 0 20px #ef4444';
    }
  }

  // Creazione della stringa descrittiva delle evidenze attive (es. "C=V, S=F")
  const titleString = evidences.length === 0 ? "Nessuna" : evidences.map(e => `${e.var}=${e.val ? 'V' : 'F'}`).join(', ');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gate di Rejection (Evidenza: {titleString})</h2>
      
      <div className={styles.gateArea}>
        
        {/* Animazione del pallino (campione) in entrata nel filtro */}
        <div className={styles.pathway}>
          <AnimatePresence>
            {sample && animState === 'evaluating' && !isAutoGenerating && (
              <motion.div
                className={styles.sampleDot}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 20, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Box centrale del filtro che cambia colore in base a isSampleAccepted */}
        <motion.div 
          className={styles.gateBox}
          animate={{
            borderColor: gateColor,
            boxShadow: gateGlow,
            backgroundColor: accepted === true ? 'rgba(34, 197, 94, 0.1)' : accepted === false ? 'rgba(239, 68, 68, 0.1)' : 'rgba(51, 65, 85, 0.5)'
          }}
          transition={{ duration: isAutoGenerating ? 0 : 0.3 }}
        >
          <h3>FILTRO</h3>
          {evidences.length === 0 && <p className={styles.filterText}>Nessun Filtro</p>}
          {evidences.map((e, idx) => (
             <p key={idx} className={styles.filterText}>
               {e.var} = {sample ? (sample[e.var] ? 'Vero' : 'Falso') : '?'}
             </p>
          ))}
        </motion.div>

        {/* Cestini / Contenitori di smistamento finale */}
        <div className={styles.binsContainer}>
          {/* Cesto Rifiutati (Trash) */}
          <div className={`${styles.bin} ${styles.binRejected}`}>
            <h4>Trash (Rifiutati)</h4>
            <AnimatePresence>
              {sample && accepted === false && animState === 'routing' && !isAutoGenerating && (
                <motion.div
                  className={styles.rejectedSample}
                  initial={{ x: 50, y: -50, opacity: 1 }}
                  animate={{ x: 0, y: 0, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Cesto Accettati */}
          <div className={`${styles.bin} ${styles.binAccepted}`}>
            <h4>Accettati</h4>
            <AnimatePresence>
              {sample && accepted === true && animState === 'routing' && !isAutoGenerating && (
                <motion.div
                  className={styles.acceptedSample}
                  initial={{ x: -50, y: -50, opacity: 1 }}
                  animate={{ x: 0, y: 0, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
