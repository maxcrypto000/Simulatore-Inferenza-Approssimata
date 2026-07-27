'use client';

import React from 'react';
import { BayesianNetwork, getInitialPieroNetwork, getTopologicalOrder } from '../lib/network';
import styles from './CPTViewer.module.css';

interface CPTViewerProps {
  network?: BayesianNetwork;
  isIntegrated?: boolean;
}

const LABELS: Record<string, string> = {
  ES: 'Estate',
  EG: 'Egna',
  S: 'Sole',
  L: 'Letto Presto',
  A: 'Amici Corrono',
  C: 'Piero Corre',
};

/**
 * Componente per visualizzare le Tabelle di Probabilità Condizionata (CPT) della Rete Bayesiana.
 * Rispecchia dinamicamente la topologia corrente (originale o trasformata dall'Evidence Integration).
 */
export default function CPTViewer({ network = getInitialPieroNetwork(), isIntegrated = false }: CPTViewerProps) {
  const topOrder = getTopologicalOrder(network);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            📊 Tabelle delle Probabilità Condizionate (CPT)
          </h2>
          <p className={styles.subtitle}>
            Ogni tabella definisce la distribuzione di probabilità condizionata del nodo dati i valori assegnati ai suoi genitori: <strong>P(Nodo = Vero | Genitori)</strong>.
          </p>
        </div>
        {isIntegrated && (
          <div className={styles.badge}>
            ⚡ Topologia Trasformata (Arc Reversal)
          </div>
        )}
      </div>

      {isIntegrated && (
        <div className={styles.banner}>
          <strong>💡 Nota sull&apos;Evidence Integration:</strong>I nodi di evidenza sono stati trasformati in radici e Le CPT mostrate qui sotto sono state <strong>ricalcolate dinamicamente</strong>.
        </div>
      )}

      <div className={styles.grid}>
        {topOrder.map((nodeId) => {
          const node = network.nodes.find(n => n.id === nodeId);
          const cpt = network.cpts[nodeId];
          if (!node || !cpt) return null;

          const parents = node.parents;
          const isRoot = parents.length === 0;

          // Ordiniamo le righe della CPT in modo decrescente (le combinazioni con "Vero/1" prima di "Falso/0")
          const tableEntries = Object.entries(cpt.table).sort(([keyA], [keyB]) => keyB.localeCompare(keyA));

          return (
            <div key={nodeId} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.nodeName}>
                  <span className={styles.nodeId}>{nodeId}</span>
                  {LABELS[nodeId] || nodeId}
                </div>
                <div className={styles.nodeParents}>
                  {isRoot ? 'Radice (A priori)' : `Genitori: ${parents.join(', ')}`}
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {parents.map((pId) => (
                        <th key={pId}>{pId} ({LABELS[pId] || pId})</th>
                      ))}
                      {isRoot && <th>Stato</th>}
                      <th>P({nodeId} = Vero)</th>
                      <th>P({nodeId} = Falso)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isRoot ? (
                      <tr>
                        <td>A priori (senza condizionamento)</td>
                        <td className={styles.probTrue}>
                          {(cpt.table[''] !== undefined ? cpt.table[''] * 100 : 0).toFixed(1)}%
                        </td>
                        <td className={styles.probFalse}>
                          {(cpt.table[''] !== undefined ? (1 - cpt.table['']) * 100 : 100).toFixed(1)}%
                        </td>
                      </tr>
                    ) : (
                      tableEntries.map(([key, prob]) => {
                        // Mappiamo la chiave "A:1|L:0|S:1" in un dizionario { A: '1', L: '0', S: '1' }
                        const parentVals: Record<string, string> = {};
                        key.split('|').forEach((part) => {
                          const [pId, val] = part.split(':');
                          if (pId && val !== undefined) {
                            parentVals[pId] = val;
                          }
                        });

                        return (
                          <tr key={key || 'root'}>
                            {parents.map((pId) => {
                              const val = parentVals[pId];
                              return (
                                <td key={pId}>
                                  {val === '1' ? (
                                    <span className={styles.valTrue}>Vero</span>
                                  ) : val === '0' ? (
                                    <span className={styles.valFalse}>Falso</span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              );
                            })}
                            <td className={styles.probTrue}>{(prob * 100).toFixed(1)}%</td>
                            <td className={styles.probFalse}>{((1 - prob) * 100).toFixed(1)}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
