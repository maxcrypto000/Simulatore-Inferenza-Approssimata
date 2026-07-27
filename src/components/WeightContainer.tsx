import React from 'react';
import { motion } from 'framer-motion';
import { LWAnimationState } from '../hooks/useLikelihoodWeighting';
import styles from './WeightContainer.module.css';

import { Sample } from '../lib/network';

/**
 * Proprietà per il componente di visualizzazione del calcolo del peso (Likelihood Weighting).
 */
interface WeightContainerProps {
  weight: number | undefined;                          // Peso finale w calcolato per il campione
  stepWeights?: Partial<Record<keyof Sample, number>>; // Pesi di step associati alle singole variabili di evidenza
  animState: LWAnimationState;                         // Stato dell'animazione
  isAutoGenerating: boolean;                           // Modalità automatica veloce (10x/sec) attiva
}

/**
 * Componente che visualizza il "Moltiplicatore di Peso" nella modalità Likelihood Weighting.
 * A differenza del Rejection Gate, qui NON esiste un cestino dei rifiuti ("Nessuno scarto"):
 * ogni campione generato concorre alla stima finale con un peso proporzionale alla verosimiglianza
 * di aver osservato le evidenze date.
 */
export default function WeightContainer({ weight, stepWeights, animState, isAutoGenerating }: WeightContainerProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Moltiplicatore di Peso</h2>

      <div className={styles.gateArea}>
        {/* Canale di ingresso del campione visualizzato */}
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

        {/* Box che mostra il calcolo del peso accumulato w */}
        <motion.div
          className={styles.gateBox}
          animate={{
            borderColor: animState === 'done' ? '#eab308' : '#334155', // giallo dorato quando il calcolo è completato
            boxShadow: animState === 'done' ? '0 0 15px #eab308' : 'none',
          }}
          transition={{ duration: isAutoGenerating ? 0 : 0.3 }}
        >
          <h3>PESO CAMPIONE</h3>

          {/* Mostra la scomposizione matematica del peso: 1.0 × P(E1=e1|Genitori) × P(E2=e2|Genitori)... */}
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

          {/* Valore numerico finale del peso w */}
          <p className={styles.filterText}>
            w = {weight !== undefined ? weight.toFixed(4) : '?'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
