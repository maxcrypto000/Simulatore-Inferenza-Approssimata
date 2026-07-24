import React from 'react';
import { motion } from 'framer-motion';
import { LWAnimationState } from '../hooks/useLikelihoodWeighting';
import styles from './WeightContainer.module.css';

import { Sample } from '../lib/inference';

interface WeightContainerProps {
  weight: number | undefined;
  stepWeights?: Partial<Record<keyof Sample, number>>;
  animState: LWAnimationState;
  isAutoGenerating: boolean;
}

export default function WeightContainer({ weight, stepWeights, animState, isAutoGenerating }: WeightContainerProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Moltiplicatore di Peso (Nessuno scarto)</h2>
      
      <div className={styles.gateArea}>
        <div className={styles.pathway}>
          {animState === 'done' && !isAutoGenerating && (
            <motion.div 
              className={styles.sampleDot}
              initial={{ top: -30, opacity: 0 }}
              animate={{ top: 60, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>

        <motion.div 
          className={styles.gateBox}
          animate={{
            borderColor: animState === 'done' ? '#eab308' : '#334155', // yellow-500
            boxShadow: animState === 'done' ? '0 0 15px #eab308' : 'none',
          }}
          transition={{ duration: isAutoGenerating ? 0 : 0.3 }}
        >
          <h3>PESO CAMPIONE</h3>
          
          {stepWeights && Object.keys(stepWeights).length > 0 && animState === 'done' && !isAutoGenerating && (
            <div className={styles.mathFormula}>
              <span>1.0</span>
              {Object.entries(stepWeights).map(([node, p]) => (
                <span key={node}>
                  {' × '}{p?.toFixed(2)}<sub>({node})</sub>
                </span>
              ))}
              <span> =</span>
            </div>
          )}

          <p className={styles.filterText}>
            w = {weight !== undefined ? weight.toFixed(4) : '?'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
