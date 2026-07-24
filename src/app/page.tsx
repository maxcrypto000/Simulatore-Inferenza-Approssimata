'use client';

import React, { useState } from 'react';
import { useRejectionSampling } from '../hooks/useRejectionSampling';
import { useLikelihoodWeighting } from '../hooks/useLikelihoodWeighting';
import NetworkGraph from '../components/NetworkGraph';
import RejectionGate from '../components/RejectionGate';
import Dashboard from '../components/Dashboard';
import WeightContainer from '../components/WeightContainer';
import LWDashboard from '../components/LWDashboard';
import { Play, Pause, StepForward, RotateCcw, ArrowRightLeft } from 'lucide-react';
import styles from './page.module.css';

function RejectionMode() {
  const {
    stats,
    isAutoGenerating,
    currentSample,
    animState,
    queryVar,
    queryVal,
    evidences,
    generateSingleSample,
    toggleAutoGeneration,
    reset,
    setConfig,
  } = useRejectionSampling();

  return (
    <>
      <div className={styles.controls}>
        <button 
          onClick={generateSingleSample} 
          disabled={isAutoGenerating || (animState !== 'idle' && animState !== 'done')}
          className={styles.btnPrimary}
        >
          <StepForward size={18} /> Genera 1 Campione
        </button>
        <button 
          onClick={toggleAutoGeneration} 
          className={isAutoGenerating ? styles.btnDanger : styles.btnSuccess}
        >
          {isAutoGenerating ? (
            <><Pause size={18} /> Pausa (10x/sec)</>
          ) : (
            <><Play size={18} /> Auto 10x/sec</>
          )}
        </button>
        <button onClick={reset} className={styles.btnSecondary}>
          <RotateCcw size={18} /> Reset
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <NetworkGraph 
            sample={currentSample} 
            animState={animState} 
            isAutoGenerating={isAutoGenerating} 
          />
        </div>
        
        <div className={styles.rightCol}>
          <RejectionGate 
            sample={currentSample} 
            animState={animState} 
            isAutoGenerating={isAutoGenerating} 
            evidences={evidences}
          />
          <Dashboard 
            stats={stats} 
            queryVar={queryVar}
            queryVal={queryVal}
            evidences={evidences}
            setConfig={setConfig}
          />
        </div>
      </div>
    </>
  );
}

function LikelihoodMode() {
  const {
    stats,
    isAutoGenerating,
    currentResult,
    animState,
    queryVar,
    queryVal,
    evidences,
    generateSingleSample,
    toggleAutoGeneration,
    reset,
    setConfig,
  } = useLikelihoodWeighting();

  return (
    <>
      <div className={styles.controls}>
        <button 
          onClick={generateSingleSample} 
          disabled={isAutoGenerating || (animState !== 'idle' && animState !== 'done')}
          className={styles.btnPrimary}
        >
          <StepForward size={18} /> Genera 1 Campione
        </button>
        <button 
          onClick={toggleAutoGeneration} 
          className={isAutoGenerating ? styles.btnDanger : styles.btnSuccess}
        >
          {isAutoGenerating ? (
            <><Pause size={18} /> Pausa (10x/sec)</>
          ) : (
            <><Play size={18} /> Auto 10x/sec</>
          )}
        </button>
        <button onClick={reset} className={styles.btnSecondary}>
          <RotateCcw size={18} /> Reset
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <NetworkGraph 
            sample={currentResult ? currentResult.sample : null} 
            animState={animState} 
            isAutoGenerating={isAutoGenerating} 
            mode="likelihood"
            stepWeights={currentResult?.stepWeights}
          />
        </div>
        
        <div className={styles.rightCol}>
          <WeightContainer 
            weight={currentResult?.weight}
            stepWeights={currentResult?.stepWeights} 
            animState={animState} 
            isAutoGenerating={isAutoGenerating} 
          />
          <LWDashboard 
            stats={stats} 
            queryVar={queryVar}
            queryVal={queryVal}
            evidences={evidences}
            setConfig={setConfig}
          />
        </div>
      </div>
    </>
  );
}

export default function Home() {
  const [mode, setMode] = useState<'rejection' | 'likelihood'>('rejection');

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1>
            {mode === 'rejection' ? 'Rejection Sampling' : 'Likelihood Weighting'} <span>Simulatore</span>
          </h1>
          <p>Rete Bayesiana: Piero corre. (Logica custom in <code>src/lib/inference.ts</code>)</p>
        </div>
        <button 
          className={styles.btnSwitch} 
          onClick={() => setMode(m => m === 'rejection' ? 'likelihood' : 'rejection')}
        >
          <ArrowRightLeft size={18} /> 
          Switch a {mode === 'rejection' ? 'Likelihood Weighting' : 'Rejection Sampling'}
        </button>
      </header>

      {mode === 'rejection' ? <RejectionMode /> : <LikelihoodMode />}
    </main>
  );
}
