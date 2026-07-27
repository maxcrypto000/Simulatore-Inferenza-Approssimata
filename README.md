# 🧠 Simulatore di Inferenza Approssimata in Reti Bayesiane

Un'applicazione web interattiva sviluppata in **Next.js**, **React** e **TypeScript** per la simulazione e la visualizzazione didattica dei principali algoritmi di inferenza probabilistica approssimata: **Rejection Sampling** (Campionamento con Rifiuto) e **Likelihood Weighting** (Pesatura della Verosimiglianza).

---

## 🎯 Obiettivo e Concetti Teorici

L'inferenza esatta nelle reti bayesiane (es. tramite eliminazione delle variabili) può diventare computazionalmente proibitiva per reti grandi e complesse ($NP$-hard). Per questo motivo si ricorre alle **tecniche di inferenza approssimata basate su campionamento (Monte Carlo)**. 

Il simulatore permette di testare e confrontare visivamente due strategie fondamentali per stimare la probabilità condizionata $P(X \mid e)$ di una variabile query $X$ date un insieme di evidenze osservate $e$:

### 1. 🗑️ Rejection Sampling (Campionamento con Rifiuto)
Il Rejection Sampling genera campioni dall'intera rete seguendo l'**ordine topologico** (dalle radici alle foglie, usando le probabilità a priori $P(X_i \mid \text{Genitori}(X_i))$). 
* **Filtro delle Evidenze:** Una volta generato il campione, si verifica se i valori assegnati alle variabili di evidenza corrispondono alle osservazioni $e$.
* **Scarto (Trash):** Se anche una sola evidenza è violata, il campione viene **rifiutato** e buttato nel cestino.
* **Stima:** La probabilità stimata $P(X=x \mid e)$ corrisponde al rapporto tra il numero di campioni accettati in cui $X=x$ e il numero totale di campioni accettati.
* **Il problema dell'Inefficienza:** Quando le evidenze osservate sono eventi rari, la maggior parte dei campioni viene scartata (alto tasso di inefficienza), sprecando preziose risorse computazionali.

---

### 2. ⚖️ Likelihood Weighting (Pesatura della Verosimiglianza)
Il Likelihood Weighting risolve il problema dello spreco computazionale del Rejection Sampling evitando di scartare i campioni.
* **Forzatura delle Evidenze:** Durante la generazione topologica, quando l'algoritmo incontra una variabile di evidenza $E_i$, **non la campiona casualmente**, ma fissa direttamente il suo valore a quello osservato $e_i$.
* **Calcolo del Peso ($w$):** Per compensare la forzatura, al campione viene assegnato un peso globale $w$, inizializzato a $1.0$ e moltiplicato, per ogni evidenza, per la probabilità di osservare quel valore dati i genitori attuali nel campione:
  $$w = \prod_{i} P(E_i = e_i \mid \text{Genitori}(E_i))$$
* **Zero Scarti:** Nessun campione viene cestinato. Ogni campione contribuisce alla statistica finale con il proprio peso $w$.
* **Stima:** La probabilità stimata $P(X=x \mid e)$ è calcolata come la somma dei pesi dei campioni in cui $X=x$ divisa per la somma totale dei pesi di tutti i campioni generati:
  $$P(X=x \mid e) \approx \frac{\sum_{j \in \text{Match}} w_j}{\sum_{\text{Tutti}} w_j}$$

---

## 🏃‍♂️ La Rete Bayesiana: "Piero corre"

Il modello probabilistico implementato simula la decisione di un ragazzo, **Piero**, di andare a correre. La rete è composta da 6 variabili booleane con le seguenti relazioni di dipendenza condizionale:

```mermaid
graph TD
    ES[Estate <br/> P=0.25] --> EG[Egna <br/> P=0.1|0.3]
    ES --> S[Sole <br/> P=0.8|0.4]
    EG --> L[Letto Presto <br/> P=0.9|0.6]
    S --> A[Amici Corrono <br/> P=0.6|0.25]
    L --> C[Piero Corre]
    A --> C
    S --> C
```

### Descrizione dei Nodi:
1. **`ES` (Estate):** Nodo radice. Indica se è la stagione estiva. ($P(\text{ES}=\text{Vero}) = 0.25$).
2. **`EG` (Egna):** Indica se Piero si trova nella cittadina di Egna. Dipende da `ES`.
3. **`S` (Sole):** Indica se la giornata è soleggiata. Dipende da `ES`.
4. **`L` (Letto Presto):** Indica se Piero è andato a dormire presto la sera prima. Dipende dalla città in cui si trova (`EG`).
5. **`A` (Amici corrono):** Indica se gli amici di Piero sono andati a correre. Dipende dal tempo atmosferico (`S`).
6. **`C` (Piero corre):** Nodo bersaglio (foglia). Piero decide se correre in base a 3 fattori: se ha riposato bene (`L`), se ci sono gli amici (`A`) e se c'è il sole (`S`). La combinazione ottimale (`L=V, A=V, S=V`) porta all'80% di probabilità di corsa, mentre la peggiore (`L=F, A=F, S=F`) solo al 5%.

---

## 📂 Struttura del Progetto

```text
src/
├── lib/
│   ├── inference.ts            # Definizione variabili, CPT e campionamento topologico (Prior Sampling)
│   └── likelihoodWeighting.ts  # Logica dell'algoritmo Likelihood Weighting e calcolo pesi w
├── hooks/
│   ├── useRejectionSampling.ts # Hook di stato e animazione per il Rejection Sampling (step / 10Hz)
│   └── useLikelihoodWeighting.ts # Hook di stato e animazione per il Likelihood Weighting
├── components/
│   ├── NetworkGraph.tsx        # Visualizzazione SVG dinamica del DAG e illuminazione nodi
│   ├── RejectionGate.tsx       # Animazione del filtro di accettazione/rifiuto e smistamento cesti
│   ├── WeightContainer.tsx     # Visualizzazione della scomposizione matematica del peso w
│   ├── Dashboard.tsx           # Cruscotto statistico per Rejection Sampling (con grafico a ciambella)
│   └── LWDashboard.tsx         # Cruscotto statistico per Likelihood Weighting
└── app/
    ├── page.tsx                # Pagina principale e Switcher interattivo tra le due modalità
    └── layout.tsx              # Layout radice del progetto Next.js
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
   Naviga all'indirizzo [http://localhost:3000](http://localhost:3000) per utilizzare il simulatore.

---

## 🎮 Guida all'Uso dell'Interfaccia

1. **Configura Query ed Evidenze:** Nel cruscotto a destra, seleziona la variabile che vuoi stimare (es. `C = Vero`) e aggiungi una o più evidenze come filtro (es. `S = Falso`, `ES = Vero`).
2. **Modalità Passo-Passo (Genera 1 Campione):** Clicca sul pulsante per osservare l'animazione didattica: vedrai i nodi della rete illuminarsi in ordine topologico e il campione essere smistato (nel gate di rifiuto) o pesato (nel moltiplicatore di verosimiglianza).
3. **Modalità Automatica ad Alta Velocità (Auto 10x/sec):** Clicca sul tasto play per generare 10 campioni al secondo in background e vedere la convergenza delle probabilità stimate verso il valore teorico in tempo reale.
4. **Confronto tra Algoritmi:** Prova a impostare un'evidenza molto rara (es. una combinazione sfavorevole) e avvia la modalità automatica. Nota come il **Rejection Sampling** riempia rapidamente il cesto "Trash" con alte percentuali di inefficienza, mentre il **Likelihood Weighting** continui a sfruttare il 100% delle iterazioni senza sprechi!
