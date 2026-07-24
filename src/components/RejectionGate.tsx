'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationState } from '../hooks/useRejectionSampling';
import { isSampleAccepted, Sample, EvidenceConfig } from '../lib/inference';
import styles from './RejectionGate.module.css';

interface RejectionGateProps {
  sample: Sample | null;
  animState: AnimationState;
  isAutoGenerating: boolean;
  evidences: EvidenceConfig[];
}

export default function RejectionGate({ sample, animState, isAutoGenerating, evidences }: RejectionGateProps) {
  
  // Determine if accepted
  const accepted = sample ? isSampleAccepted(sample, evidences) : null;
  
  // Gate color
  let gateColor = '#334155'; // default slate-700
  let gateGlow = 'none';

  if (sample && (animState === 'evaluating' || animState === 'routing' || animState === 'done')) {
    if (accepted) {
      gateColor = '#22c55e'; // green
      gateGlow = '0 0 20px #22c55e';
    } else {
      gateColor = '#ef4444'; // red
      gateGlow = '0 0 20px #ef4444';
    }
  }

  const titleString = evidences.length === 0 ? "Nessuna" : evidences.map(e => `${e.var}=${e.val ? 'V' : 'F'}`).join(', ');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gate di Rejection (Evidenza: {titleString})</h2>
      
      <div className={styles.gateArea}>
        
        {/* Sample Incoming */}
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

        {/* The Gate itself */}
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

        {/* Bins */}
        <div className={styles.binsContainer}>
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
