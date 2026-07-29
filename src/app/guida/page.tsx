import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, SlidersHorizontal, Share2, Info, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import styles from './guida.module.css';

export default function Guida() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.btnBack} title="Torna al simulatore">
            <ArrowLeft size={20} />
            <span>Torna al simulatore</span>
          </Link>
          <h1>
            Guida al <span>Simulatore</span>
          </h1>
          <p className={styles.subtitle}>
            Scopri come utilizzare al meglio il simulatore di inferenza approssimata per reti bayesiane.
          </p>
        </div>
      </header>

      <div className={styles.container}>

        {/* Sezione: Motore di Inferenza */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <SlidersHorizontal className={styles.icon} size={28} />
            <h2>Scegliere il Motore di Inferenza</h2>
          </div>
          <div className={styles.content}>
            <p>
              Il simulatore permette di confrontare due algoritmi di inferenza approssimata per reti bayesiane:
              <strong> Rejection Sampling</strong> e <strong>Likelihood Weighting</strong>.
            </p>
            <ul>
              <li>
                <strong>Rejection Sampling:</strong> Genera campioni casuali dalla rete e scarta (rigetta) quelli che non corrispondono all'evidenza. È intuitivo ma può essere molto inefficiente se l'evidenza è rara (alta percentuale di campioni scartati).
              </li>
              <li>
                <strong>Likelihood Weighting:</strong> Fissa i valori delle variabili di evidenza e pesa ogni campione in base alla probabilità (verosimiglianza) dell'evidenza data la parte di campione generata fino a quel momento. Nessun campione viene scartato, rendendo l'algoritmo generalmente più efficiente.
              </li>
            </ul>
            <div className={styles.tip}>
              <Info size={20} />
              <span>
                Puoi passare da un algoritmo all'altro cliccando il pulsante <strong>Switch</strong> in alto a destra nella schermata principale.
              </span>
            </div>
          </div>
        </section>

        {/* Sezione: Come fare una query */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Search className={styles.icon} size={28} />
            <h2>Come Fare una Query (Interrogazione)</h2>
          </div>
          <div className={styles.content}>
            <p>
              Per interrogare la rete bayesiana e calcolare la probabilità di un evento, utilizza la barra di simulazione in alto.
            </p>
            <ol>
              <li>
                <strong>Seleziona la Variabile Query:</strong> Dal primo menu a tendina, scegli la variabile di cui vuoi stimare la probabilità (es. <em>Estate</em>, <em>Amici</em>, ecc.).
              </li>
              <li>
                <strong>Seleziona il Valore Desiderato:</strong> Scegli il valore che ti interessa per quella variabile (es. <em>Vero</em> o <em>Falso</em>).
              </li>
              <li>
                <strong>Imposta le Evidenze (Opzionale):</strong> Puoi aggiungere variabili osservate e i loro valori per calcolare una probabilità condizionata.
              </li>
            </ol>
            <p>
              Una volta configurata la query, puoi avviare la simulazione cliccando su <strong>Auto Play</strong> per generare campioni in automatico, oppure <strong>+1 Sample</strong> per procedere passo passo.
            </p>
          </div>
        </section>

        {/* Sezione: Evidential Integration */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Share2 className={styles.icon} size={28} />
            <h2>Evidential Integration (Integrazione Evidenziale)</h2>
          </div>
          <div className={styles.content}>
            <p>
              L'Integrazione Evidenziale è una tecnica avanzata disponibile nella modalità <strong>Likelihood Weighting</strong>.
              Questa ottimizzazione manipola la struttura (topologia) della rete bayesiana per migliorare l'efficienza del campionamento quando ci sono dipendenze forti o evidenze specifiche.
            </p>
            <ul>
              <li>
                <strong>Come attivarla:</strong> Quando sei in modalità <em>Likelihood Weighting</em> e hai impostato almeno un'evidenza, apparirà il pulsante <strong>"Applica Integrazione Evidenziale"</strong> nel pannello laterale.
              </li>
              <li>
                <strong>Cosa succede:</strong> Cliccando il pulsante, il grafo della rete verrà aggiornato (mostrando eventuali inversioni degli archi o cambiamenti nelle dipendenze) e le tabelle delle probabilità condizionate (CPT) si adatteranno di conseguenza.
              </li>
              <li>
                <strong>Ripristino:</strong> Puoi tornare alla struttura originale della rete in qualsiasi momento cliccando su <strong>"Ripristina Rete Originale"</strong>.
              </li>
            </ul>
          </div>
        </section>

        {/* Sezione: Cruscotto e Visualizzazione */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Layers className={styles.icon} size={28} />
            <h2>Cruscotto e Lettura dei Risultati</h2>
          </div>
          <div className={styles.content}>
            <p>
              Il lato destro dell'interfaccia ospita il cruscotto con tutte le statistiche in tempo reale:
            </p>
            <ul>
              <li><strong>Stima (P):</strong> La probabilità calcolata dal simulatore in base ai campioni validi generati finora. Più campioni generi, più la stima si avvicinerà al valore esatto.</li>
              <li><strong>Campioni Validi / Totali:</strong> Mostra quanti campioni hanno contribuito alla stima rispetto a quelli generati. Nel <em>Rejection Sampling</em>, vedrai anche la percentuale di "Inefficienza" (campioni buttati).</li>
              <li><strong>Peso Cumulato:</strong> Specifico del <em>Likelihood Weighting</em>, indica la somma dei pesi di tutti i campioni generati.</li>
            </ul>
            <div className={styles.tip}>
              <CheckCircle2 size={20} />
              <span>
                Puoi consultare le <strong>Tabelle CPT</strong> (Conditional Probability Tables) in fondo alla pagina per esaminare le probabilità originali di ciascun nodo.
              </span>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
