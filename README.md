# 🧠 Simulatore di Inferenza Approssimata e Evidential Integration in Reti Bayesiane

Un'applicazione web interattiva, ad alto impatto visivo e didattico, sviluppata in **Next.js**, **React** e **TypeScript** per la simulazione, la visualizzazione e l'analisi dei principali algoritmi di inferenza probabilistica approssimata su grafi orientati aciclici (DAG):
1. 🗑️ **Rejection Sampling** (Campionamento con Rifiuto)
2. ⚖️ **Likelihood Weighting** (Pesatura della Verosimiglianza)
3. ⚡ **Evidential Integration via Arc Reversal** (Algoritmo di Shachter e Teorema di Bayes)

---

## 🎯 Obiettivo e Concetti Teorici

L'inferenza esatta nelle reti bayesiane (es. tramite eliminazione delle variabili) può diventare computazionalmente proibitiva per reti grandi e complesse ($NP$-hard). Per questo motivo si ricorre alle **tecniche di inferenza approssimata basate su campionamento (Monte Carlo)**. 

Il simulatore adotta un'architettura 100% dinamica basata su strutture dati universali (`BayesianNetwork`, `BayesNode`, `BayesCPT`) che permette di esplorare come stimare la probabilità condizionata $P(X \mid e)$ di una variabile query $X$ date un insieme di evidenze osservate $e$:

### 1. 🗑️ Rejection Sampling (Campionamento con Rifiuto)
Il Rejection Sampling genera campioni casuali a priori (Prior Sampling) percorrendo l'**ordine topologico** del grafo (calcolato dinamicamente con l'algoritmo di Kahn).
* **Filtro delle Evidenze:** Una volta generato il campione, si verifica se i valori assegnati alle variabili di evidenza corrispondono esattamente alle osservazioni $e$.
* **Scarto (Trash):** Se anche una sola evidenza è violata, il campione viene **rifiutato** e gettato nel cestino.
* **Stima:** La probabilità stimata $P(X=x \mid e)$ corrisponde al rapporto tra il numero di campioni accettati in cui $X=x$ e il numero totale di campioni accettati.
* **Il problema dell'Inefficienza:** Quando le evidenze osservate sono eventi rari, la maggior parte dei campioni viene scartata (alto tasso di inefficienza), sprecando preziose risorse computazionali.

---

### 2. ⚖️ Likelihood Weighting (Pesatura della Verosimiglianza)
Il Likelihood Weighting risolve il problema dello spreco computazionale evitando totalmente di scartare i campioni.
* **Forzatura delle Evidenze:** Durante la generazione topologica, quando l'algoritmo incontra una variabile di evidenza $E_i$, **non la campiona casualmente**, ma fissa direttamente il suo valore a quello osservato $e_i$.
* **Calcolo del Peso ($w$):** Per compensare la forzatura, al campione viene assegnato un peso globale $w$, inizializzato a $1.0$ e moltiplicato, per ogni evidenza, per la probabilità di osservare quel valore dati i genitori attuali nel campione:
  $$w = \prod_{i} P(E_i = e_i \mid \text{Genitori}(E_i))$$
* **Zero Scarti:** Nessun campione viene cestinato. Ogni campione contribuisce alla statistica finale con il proprio peso $w$.
* **Stima:** La probabilità stimata $P(X=x \mid e)$ è calcolata come la media pesata dei campioni favorevoli sul totale dei pesi:
  $$P(X=x \mid e) \approx \frac{\sum_{j \in \text{Match}} w_j}{\sum_{\text{Tutti}} w_j}$$

---

### 3. ⚡ Evidential Integration (Arc Reversal di Shachter)
Anche nel Likelihood Weighting tradizionale, se le variabili di evidenza si trovano a fondo grafo (nodi foglia con molti genitori), il peso $w$ attribuito al campione può subire una forte varianza, rallentando la convergenza.

L'**Evidential Integration** supera questo limite trasformando dinamicamente la topologia del grafo prima del campionamento. Utilizza l'**algoritmo di Arc Reversal di Shachter** per invertire iterativamente gli archi diretti verso i nodi di evidenza, trasformandoli in **nodi radice (senza genitori)**.

#### Il Teorema di Shachter per l'Inversione dell'Arco $X \rightarrow Y$:
1. **Topologia:** Si definisce l'insieme dei genitori congiunti $U = (\text{Pa}(X) \cup \text{Pa}(Y)) \setminus \{X\}$. Nel nuovo grafo, $Y$ avrà genitori $U$, mentre $X$ avrà genitori $U \cup \{Y\}$.
2. **Point-wise Product (Congiunta):** Si calcola la distribuzione congiunta locale:
   $$\text{Joint}(X, Y \mid U) = P_{\text{old}}(X \mid \text{Pa}(X)) \times P_{\text{old}}(Y \mid X, \text{Pa}(Y))$$
3. **Summing-Out (Marginalizzazione):** Si ottiene la nuova CPT di $Y$ sommando via i casi di $X$:
   $$P_{\text{new}}(Y \mid U) = \sum_{x \in \{V, F\}} \text{Joint}(X=x, Y \mid U)$$
4. **Teorema di Bayes (Divisione):** Si ricalcola la nuova CPT condizionata di $X$:
   $$P_{\text{new}}(X \mid Y, U) = \frac{\text{Joint}(X, Y \mid U)}{P_{\text{new}}(Y \mid U)}$$

**Risultato visivo e computazionale:** Nella UI di Likelihood Weighting, cliccando su **"Applica Evidential Integration"**, le frecce del grafo SVG **si invertono fisicamente** illuminandosi di ciano (`#00e5ff`) e le tabelle CPT vengono ricalcolate al volo!

---

## 🏃‍♂️ La Rete Bayesiana di Esempio

Il modello probabilistico implementato di default simula la decisione di un ragazzo di andare a correre. La rete è composta da 6 variabili booleane con le seguenti relazioni di dipendenza condizionale:

```mermaid
graph TD
    ES[Estate <br/> P=0.25] --> EG[Egna <br/> P=0.1|0.3]
    ES --> S[Sole <br/> P=0.8|0.4]
    EG --> L[Letto Presto <br/> P=0.9|0.6]
    S --> A[Amici Corrono <br/> P=0.6|0.25]
    L --> C[Corsa]
    A --> C
    S --> C
```

### Descrizione dei Nodi:
1. **`ES` (Estate):** Nodo radice. Indica se è la stagione estiva ($P(\text{ES}=\text{Vero}) = 0.25$).
2. **`EG` (Egna):** Indica se Piero si trova nella cittadina di Egna. Dipende da `ES`.
3. **`S` (Sole):** Indica se la giornata è soleggiata. Dipende da `ES`.
4. **`L` (Letto Presto):** Indica se il ragazzo è andato a dormire presto la sera prima. Dipende dalla città in cui si trova (`EG`).
5. **`A` (Amici corrono):** Indica se gli amici sono andati a correre. Dipende dal tempo atmosferico (`S`).
6. **`C` (Corsa):** Nodo target (foglia). Il ragazzo decide se correre in base a 3 fattori: se ha riposato bene (`L`), se ci sono gli amici (`A`) e se c'è il sole (`S`). La combinazione ottimale (`L=V, A=V, S=V`) porta all'80% di probabilità di corsa, mentre la peggiore (`L=F, A=F, S=F`) solo al 5%.

---

## 📂 Struttura del Progetto

Il progetto adotta una rigorosa **separazione delle responsabilità (Separation of Concerns)** in cui le strutture dati centrali alimentano in modo dinamico e trasparente i vari motori algoritmici:

```text
src/
├── lib/
│   ├── network.ts              # 🏛️ Sorgente Unica di Verità: strutture dati dinamiche (BayesNode, BayesCPT, BayesianNetwork), CPT di default, ordinamento topologico (Kahn) e utility di accesso.
│   ├── inference.ts            # 🗑️ Motore dinamico di Rejection Sampling (Prior Sampling su topologia e filtro evidenze).
│   ├── likelihoodWeighting.ts  # ⚖️ Motore dinamico di Likelihood Weighting (campionamento pesato topologico e forzatura evidenze).
│   └── evidenceIntegration.ts  # ⚡ Motore matematico puro di Arc Reversal (Teorema di Shachter e marginalizzazione di Bayes).
├── hooks/
│   ├── useRejectionSampling.ts # Hook React per la gestione dello stato e delle animazioni del Rejection Sampling.
│   └── useLikelihoodWeighting.ts # Hook React per Likelihood Weighting con supporto all'Evidential Integration.
├── components/
│   ├── NetworkGraph.tsx        # 🎨 Componente SVG che visualizza il DAG, l'illuminazione dei nodi in tempo reale e l'inversione fisica degli archi.
│   ├── RejectionGate.tsx       # Animazione interattiva dello smistamento dei campioni tra cestino "Trash" e cesto "Accepted".
│   ├── WeightContainer.tsx     # Breakdown visuale del moltiplicatore di verosimiglianza $w$.
│   ├── Dashboard.tsx           # Cruscotto statistico di controllo per Rejection Sampling con grafico a ciambella.
│   └── LWDashboard.tsx         # Cruscotto statistico per Likelihood Weighting con controlli per Evidential Integration.
└── app/
    ├── page.tsx                # Pagina principale e switcher istantaneo tra le due modalità di inferenza.
    └── layout.tsx              # Layout radice del progetto Next.js.
```

---

## 🚀 Guida all'Avvio Locale

Assicurati di avere [Node.js](https://nodejs.org/) (versione 18 o superiore) installato sul tuo sistema.

1. **Clona o apri il progetto nel terminale:**
   ```bash
   cd applicazioneIA
   ```

2. **Installa le dipendenze:**
   ```bash
   npm install
   ```

3. **Avvia il server di sviluppo locale:**
   ```bash
   npm run dev
   ```

4. **Apri il browser:**
   Naviga all'indirizzo [http://localhost:3000](http://localhost:3000) per utilizzare il simulatore interattivo.

---

## 🎮 Guida all'Uso dell'Interfaccia

1. **Configura Query ed Evidenze:** Nel cruscotto a destra, seleziona la variabile che vuoi stimare (es. `C = Vero`) e aggiungi una o più evidenze come filtro (es. `S = Falso`, `ES = Vero`).
2. **Modalità Passo-Passo (Genera 1 Campione):** Clicca sul pulsante per osservare l'animazione didattica: vedrai i nodi della rete illuminarsi in ordine topologico e il campione essere smistato (nel gate di rifiuto) o pesato (nel moltiplicatore di verosimiglianza).
3. **Modalità Automatica ad Alta Velocità (Auto 10x/sec):** Clicca sul tasto play per generare 10 campioni al secondo in background e vedere la convergenza delle probabilità stimate verso il valore teorico in tempo reale.
4. **Sperimenta l'Evidential Integration:** Passa alla modalità **Likelihood Weighting** e clicca sull'esclusivo pulsante **"Applica Evidential Integration"**. Osserva le frecce del grafo che puntano verso l'evidenza capovolgersi in tempo reale (colorandosi di ciano) e nota come il campionamento diventi immediatamente più stabile e informato a priori!
5. **Confronto tra Algoritmi:** Prova a impostare un'evidenza molto rara (es. una combinazione sfavorevole) e avvia la modalità automatica. Nota come il **Rejection Sampling** riempia rapidamente il cesto "Trash" con alte percentuali di inefficienza, mentre il **Likelihood Weighting** (ancor più se potenziato con **Evidential Integration**) continui a sfruttare il 100% delle iterazioni senza alcuno spreco computazionale!
