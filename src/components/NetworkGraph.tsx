'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimationState } from '../hooks/useRejectionSampling';
import { Sample } from '../lib/inference';
import styles from './NetworkGraph.module.css';

interface NetworkGraphProps {
  sample: Sample | null;
  animState: AnimationState | 'generating' | 'evaluating' | 'done' | 'idle';
  isAutoGenerating: boolean;
  mode?: 'rejection' | 'likelihood';
  stepWeights?: Partial<Record<keyof Sample, number>>;
}

const NODES = {
  ES: { id: 'ES', label: 'Estate', x: 300, y: 40 },
  EG: { id: 'EG', label: 'Egna', x: 150, y: 140 },
  S:  { id: 'S',  label: 'Sole', x: 450, y: 140 },
  L:  { id: 'L',  label: 'Letto Presto', x: 150, y: 240 },
  A:  { id: 'A',  label: 'Amici Corrono', x: 450, y: 240 },
  C:  { id: 'C',  label: 'Piero Corre', x: 300, y: 340 },
};

const EDGES = [
  { from: 'ES', to: 'EG' },
  { from: 'ES', to: 'S' },
  { from: 'EG', to: 'L' },
  { from: 'S',  to: 'A' },
  { from: 'L',  to: 'C' },
  { from: 'A',  to: 'C' },
  { from: 'S',  to: 'C' }, // C dipende da L, A, S
];

export default function NetworkGraph({ sample, animState, isAutoGenerating, mode = 'rejection', stepWeights }: NetworkGraphProps) {
  
  // Helper to determine node color based on current sample
  const getNodeColor = (nodeId: keyof Sample) => {
    if (!sample) return '#334155'; // default slate-700
    
    // In fast mode, just show the final colors instantly. 
    // In step-by-step, we could add delays, but for simplicity we rely on the sample being present
    // and if we are in 'generating' state, they pop up.
    
    const value = sample[nodeId];
    return value ? '#22c55e' : '#ef4444'; // green or red
  };

  const getGlow = (nodeId: keyof Sample) => {
    if (!sample) return 'none';
    const value = sample[nodeId];
    return value ? '0 0 15px #22c55e' : '0 0 15px #ef4444';
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>La Fabbrica dei Campioni (Rete Bayesiana)</h2>
      <svg width="600" height="400" className={styles.svg}>
        {/* Draw edges */}
        {EDGES.map((edge, i) => {
          const from = NODES[edge.from as keyof typeof NODES];
          const to = NODES[edge.to as keyof typeof NODES];
          
          // A bit of math to make arrows look nice (optional, basic line for now)
          return (
            <line
              key={`edge-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#475569" // slate-600
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Arrowhead definition */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
        </defs>

        {/* Draw nodes */}
        {Object.values(NODES).map((node) => {
          const color = getNodeColor(node.id as keyof Sample);
          const glow = getGlow(node.id as keyof Sample);
          
          return (
            <g key={node.id}>
              {/* Tooltip Likelihood Weighting */}
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
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill="#1e293b" // slate-800
                stroke={color}
                strokeWidth="4"
                animate={{
                  stroke: color,
                  boxShadow: glow, // Not natively supported on SVG circles via motion, but we can fake it with drop-shadow filter
                }}
                transition={{ duration: isAutoGenerating ? 0 : 0.3 }}
                style={{ filter: sample ? `drop-shadow(0px 0px 8px ${color})` : 'none' }}
              />
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
              {/* External label */}
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
