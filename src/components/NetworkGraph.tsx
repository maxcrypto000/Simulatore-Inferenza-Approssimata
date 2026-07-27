'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimationState } from '../hooks/useRejectionSampling';
import { Sample } from '../lib/network';
import { BayesianNetwork } from '../lib/evidenceIntegration';
import styles from './NetworkGraph.module.css';

/**
 * Proprietà del componente di visualizzazione della Rete Bayesiana.
 */
interface NetworkGraphProps {
  sample: Sample | null;                                                     // Campione attualmente in valutazione
  animState: AnimationState | 'generating' | 'evaluating' | 'done' | 'idle'; // Stato del ciclo di animazione
  isAutoGenerating: boolean;                                                 // Flag che indica se è attiva la generazione veloce
  mode?: 'rejection' | 'likelihood';                                         // Modalità di inferenza attiva
  stepWeights?: Partial<Record<keyof Sample, number>>;                       // Pesi intermedi di ogni nodo (per LW)
  network?: BayesianNetwork;                                                 // Rete Bayesiana dinamica (per Evidence Integration)
  reversals?: { from: string; to: string }[];                                // Storico archi invertiti da evidenziare
}

/**
 * Definizione dei nodi (variabili aleatorie) della Rete Bayesiana e delle loro coordinate SVG per la vista grafica.
 * Il grafo ha 4 livelli gerarchici:
 * - Livello 0: ES (Estate)
 * - Livello 1: EG (Egna), S (Sole)
 * - Livello 2: L (Letto presto), A (Amici corrono)
 * - Livello 3: C (Piero corre)
 */
const NODES = {
  ES: { id: 'ES', label: 'Estate', x: 300, y: 40 },
  EG: { id: 'EG', label: 'Egna', x: 150, y: 140 },
  S: { id: 'S', label: 'Sole', x: 450, y: 140 },
  L: { id: 'L', label: 'Letto Presto', x: 150, y: 240 },
  A: { id: 'A', label: 'Amici Corrono', x: 450, y: 240 },
  C: { id: 'C', label: 'Piero Corre', x: 300, y: 340 },
};

/**
 * Definizione degli archi diretti (dipendenze condizionali) della Rete Bayesiana.
 * Ogni arco va dal nodo genitore (from) al nodo figlio (to).
 */
const EDGES = [
  { from: 'ES', to: 'EG' }, // Egna dipende da Estate
  { from: 'ES', to: 'S' },  // Sole dipende da Estate
  { from: 'EG', to: 'L' },  // Letto presto dipende da Egna
  { from: 'S', to: 'A' },  // Amici corrono dipende da Sole
  { from: 'L', to: 'C' },  // Piero corre dipende da Letto
  { from: 'A', to: 'C' },  // Piero corre dipende da Amici
  { from: 'S', to: 'C' },  // Piero corre dipende dal Sole (arco diretto)
];

/**
 * Componente che disegna il grafo orientato aciclico (DAG) della rete bayesiana
 * e anima in tempo reale l'attivazione dei nodi in base ai valori estratti nel campione.
 */
export default function NetworkGraph({ sample, animState, isAutoGenerating, mode = 'rejection', stepWeights, network, reversals }: NetworkGraphProps) {

  // Se viene passata una rete dinamica (es. dopo Evidence Integration), ricaviamo gli archi dai nodi
  const edgesToRender = network
    ? network.nodes.flatMap(node => node.parents.map(p => ({ from: p, to: node.id })))
    : EDGES;

  /**
   * Restituisce il colore del nodo in base al valore booleano nel campione attuale:
   * - Verde (#22c55e) se la variabile è Vera (true)
   * - Rosso (#ef4444) se la variabile è Falsa (false)
   * - Grigio scuro/bluastro se non c'è ancora un campione
   */
  const getNodeColor = (nodeId: keyof Sample) => {
    if (!sample) return '#334155'; // colore di default (slate-700)

    const value = sample[nodeId];
    return value ? '#22c55e' : '#ef4444'; // verde per Vero, rosso per Falso
  };

  /**
   * Restituisce l'effetto bagliore (glow / drop-shadow) in base al valore booleano del nodo.
   */
  const getGlow = (nodeId: keyof Sample) => {
    if (!sample) return 'none';
    const value = sample[nodeId];
    return value ? '0 0 15px #22c55e' : '0 0 15px #ef4444';
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Rete Bayesiana</h2>
      <svg width="600" height="400" className={styles.svg}>
        {/* 1. Disegno degli archi (frecce di dipendenza condizionale, con evidenziazione se invertiti) */}
        {edgesToRender.map((edge, i) => {
          const from = NODES[edge.from as keyof typeof NODES];
          const to = NODES[edge.to as keyof typeof NODES];
          if (!from || !to) return null;

          // Verifica se questo specifico arco è stato invertito dall'Evidence Integration
          const isReversed = reversals?.some(r => r.from === edge.from && r.to === edge.to);
          const strokeColor = isReversed ? '#00e5ff' : '#475569'; // azzurro brillante se invertito, slate-600 se originale
          const strokeWidth = isReversed ? '3' : '2';
          const markerId = isReversed ? 'url(#arrowhead-reversed)' : 'url(#arrowhead)';

          return (
            <line
              key={`edge-${edge.from}-${edge.to}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={isReversed ? '6 3' : 'none'}
              markerEnd={markerId}
            />
          );
        })}

        {/* Definizione dei marcatori punta della freccia SVG */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
          <marker id="arrowhead-reversed" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#00e5ff" />
          </marker>
        </defs>

        {/* 2. Disegno dei nodi e delle relative etichette */}
        {Object.values(NODES).map((node) => {
          const color = getNodeColor(node.id as keyof Sample);
          const glow = getGlow(node.id as keyof Sample);

          return (
            <g key={node.id}>
              {/* Tooltip per il Likelihood Weighting: mostra la probabilità condizionata p_i moltiplicata per quel nodo */}
              {mode === 'likelihood' && sample && animState === 'evaluating' && !isAutoGenerating && stepWeights && stepWeights[node.id as keyof Sample] !== undefined && (
                <foreignObject x={node.x - 50} y={node.y - 80} width="100" height="50">
                  <motion.div
                    className={styles.lwTooltip}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, type: 'spring' }}
                  >
                    x {stepWeights[node.id as keyof Sample]?.toFixed(2)}
                  </motion.div>
                </foreignObject>
              )}

              {/* Cerchio del nodo animato con Framer Motion */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill="#1e293b" // slate-800
                stroke={color}
                strokeWidth="4"
                animate={{
                  stroke: color,
                  boxShadow: glow,
                }}
                transition={{ duration: isAutoGenerating ? 0 : 0.3 }}
                style={{ filter: sample ? `drop-shadow(0px 0px 8px ${color})` : 'none' }}
              />

              {/* Sigla identificativa all'interno del nodo (es. ES, EG, S...) */}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dy=".3em"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {node.id}
              </text>

              {/* Etichetta descrittiva esterna (es. Estate, Egna, Sole...) */}
              <text
                x={node.x}
                y={node.y - 30}
                textAnchor="middle"
                fill="#94a3b8" // slate-400
                fontSize="14"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
