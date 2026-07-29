'use client';

import React, { useState } from 'react';
import { useRejectionSampling } from '../hooks/useRejectionSampling';
import { useLikelihoodWeighting } from '../hooks/useLikelihoodWeighting';
import NetworkGraph from '../components/NetworkGraph';
import RejectionGate from '../components/RejectionGate';
import Dashboard from '../components/Dashboard';
import WeightContainer from '../components/WeightContainer';
import LWDashboard from '../components/LWDashboard';
import CPTViewer from '../components/CPTViewer';
import SimulationBar from '../components/SimulationBar';
import { ArrowRightLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

/**
 * Vista e controlli per la modalità "Rejection Sampling".
 * Gestisce l'interfaccia utente con il grafo bayesiano, il gate di filtro (dove i campioni incompatibili
 * vengono scartati nel cestino) e il cruscotto con le statistiche e la percentuale di inefficienza.
 */
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
      {/* Barra unificata sulla prima riga: pulsanti di controllo e selettore di Query ed Evidenze */}
      <SimulationBar
        queryVar={queryVar}
        queryVal={queryVal}
        evidences={evidences}
        setConfig={setConfig}
        onGenerateSingle={generateSingleSample}
        onToggleAuto={toggleAutoGeneration}
        onReset={reset}
        isAutoGenerating={isAutoGenerating}
        animState={animState}
        isLW={false}
      />

      {/* Griglia principale a 2 colonne: Grafo a sinistra, Filtro e Statistiche a destra */}
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
      <CPTViewer isIntegrated={false} />
    </>
  );
}

/**
 * Vista e controlli per la modalità "Likelihood Weighting".
 * Gestisce l'interfaccia dove nessun campione viene mai buttato via:
 * i nodi di evidenza vengono fissati e ogni campione viene pesato con la verosimiglianza condizionata.
 */
function LikelihoodMode() {
  const {
    stats,
    isAutoGenerating,
    currentResult,
    animState,
    queryVar,
    queryVal,
    evidences,
    network,
    isIntegrated,
    reversals,
    generateSingleSample,
    toggleAutoGeneration,
    reset,
    setConfig,
    applyEvidenceIntegration,
    resetNetworkTopology,
  } = useLikelihoodWeighting();

  return (
    <>
      {/* Barra unificata sulla prima riga: pulsanti di controllo e selettore di Query ed Evidenze */}
      <SimulationBar
        queryVar={queryVar}
        queryVal={queryVal}
        evidences={evidences}
        setConfig={setConfig}
        onGenerateSingle={generateSingleSample}
        onToggleAuto={toggleAutoGeneration}
        onReset={reset}
        isAutoGenerating={isAutoGenerating}
        animState={animState}
        isLW={true}
      />

      {/* Griglia principale a 2 colonne per la modalità LW */}
      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <NetworkGraph
            sample={currentResult ? currentResult.sample : null}
            animState={animState}
            isAutoGenerating={isAutoGenerating}
            mode="likelihood"
            stepWeights={currentResult?.stepWeights}
            network={network}
            reversals={reversals}
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
            isIntegrated={isIntegrated}
            reversals={reversals}
            applyEvidenceIntegration={applyEvidenceIntegration}
            resetNetworkTopology={resetNetworkTopology}
          />
        </div>
      </div>
      <CPTViewer network={network} isIntegrated={isIntegrated} />
    </>
  );
}

/**
 * Componente principale dell'applicazione (Home Page).
 * Consente di alternare visivamente e istantaneamente le due modalità di inferenza approssimata:
 * Rejection Sampling e Likelihood Weighting, per confrontarne efficienza e comportamento.
 */
export default function Home() {
  const [mode, setMode] = useState<'rejection' | 'likelihood'>('rejection');

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/guida" className={styles.btnGuide} title="Vai alla guida">
            <HelpCircle size={20} />
            Guida
          </Link>
          <h1 style={{ textAlign: 'center' }}>
            {mode === 'rejection' ? 'Rejection Sampling' : 'Likelihood Weighting'} <span>Simulatore</span>
          </h1>
        </div>

        {/* Pulsante di Switch tra i due algoritmi di inferenza */}
        <button
          className={styles.btnSwitch}
          onClick={() => setMode(m => m === 'rejection' ? 'likelihood' : 'rejection')}
        >
          <ArrowRightLeft size={18} />
          Switch a {mode === 'rejection' ? 'Likelihood Weighting' : 'Rejection Sampling'}
        </button>
      </header>

      {/* Rendering condizionale della modalità selezionata */}
      {mode === 'rejection' ? <RejectionMode /> : <LikelihoodMode />}
    </main>
  );
}
