# 📡 Deal Radar

Un'app web PWA per tenere traccia dei prezzi di mercato dei prodotti usati (console, GPU, controller) e valutare rapidamente se un'offerta è un affare o no.

Pensata per chi compra e rivende elettronica di seconda mano su Vinted, Subito, eBay o mercatini locali.

---

## Funzionalità

### Catalogo prodotti
- Database di prodotti organizzato in **navigazione gerarchica** (es. Console → Nintendo → Switch → Switch Lite)
- Filtro per categoria, ricerca testuale, ordinamento A→Z / Z→A
- Ogni prodotto ha prezzi per quattro condizioni: *Da riparare*, *Buone*, *Ottime*, *Come nuovo*
- Indicatore di freschezza dati: verde se aggiornato di recente, arancione/rosso se i prezzi sono vecchi

### Storico prezzi
- Ogni aggiornamento di prezzo viene salvato con la data
- Grafico a linee per visualizzare l'andamento nel tempo per condizione

### Scheda dettaglio prodotto
Ogni prodotto ha una scheda completa con:

- **Riparazione** — difficoltà (Facile / Media / Difficile / Specialistica), note tecniche sui problemi comuni
- **Quick Fix** — lista dei difetti più frequenti con link diretti a iFixit e YouTube
- **CFW / Homebrew** — se la console è modificabile, metodo consigliato e link alla guida
- **Storage** — se l'HDD è sostituibile con un SSD e se vale la pena farlo
- **Prompt AI** — genera un prompt contestuale da incollare in Claude o ChatGPT per ottenere una descrizione del prodotto

### Valuta affare
Inserisci il prezzo che vedi nell'annuncio e l'app lo confronta con la media di mercato salvata, mostrando un verdetto (*Ottimo affare / Buon affare / Nella norma / Prezzo alto*) e il margine potenziale se vuoi rivendere il prodotto in condizione diversa.

### Import / Export
- **Export** del database in JSON per backup
- **Import** con gestione dei conflitti: se un prodotto esiste già, puoi scegliere se unire i prezzi, sostituire i dati o saltare

### Temi
Cinque temi selezionabili dalle impostazioni: Dark, AMOLED (puro nero per schermi OLED), Light, Nord, Dracula.

---

## Database incluso

Il repository include un backup JSON con **35 prodotti** pre-configurati:

| Categoria | Prodotti |
|-----------|----------|
| Console | PlayStation 1, 2, 3 (Fat/Slim/Super Slim), 4 · Xbox 360 (Fat/Slim), Xbox One (Fat/S) · Nintendo Wii, Wii U, Switch (Standard/Lite/OLED) · GameCube · 3DS, 3DS XL, New 3DS XL, 2DS |
| GPU | RTX 3050, 3060, 3070, 3080 · RTX 4060, 4060 Ti, 4070, 4070 Super, 4070 Ti, 4080, 4080 Super |
| Controller | DualShock 3, DualShock 4 · Controller Xbox 360, Xbox One |

Per ogni prodotto sono già presenti: difficoltà di riparazione, problemi comuni, quick fix con link iFixit, info CFW/homebrew, info storage/SSD, breadcrumb di navigazione.

Per importarlo: **Impostazioni → Importa JSON** → seleziona `dealradar-backup-final.json`.

---

## Installazione come PWA

L'app è installabile direttamente dal browser senza app store.

**Desktop (Chrome / Edge)**
```
1. Apri l'app nel browser
2. Clicca l'icona di installazione nella barra degli indirizzi
3. Conferma → si apre come app standalone
```

**Android**
```
1. Apri l'app in Chrome
2. Menu → "Installa app" (o banner automatico)
```

**iOS / Safari**
```
1. Apri l'app in Safari
2. Condividi → "Aggiungi a schermata Home"
```

L'app funziona **offline** dopo la prima visita grazie al service worker.

---

## Struttura del progetto

```
dealradar/
├── index.html                     # App principale (single page)
├── manifest.json                  # Configurazione PWA
├── sw.js                          # Service worker (cache + aggiornamenti)
├── css/
│   └── master.css                 # Tutti gli stili
├── js/
│   └── script.js                  # Logica applicazione
├── icons/                         # Icone PWA (da generare)
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   └── icon-maskable-512.png
└── dealradar-backup-final.json    # Database prodotti pre-configurato
```

---

## Aggiornare la versione

Quando modifichi `script.js` o `master.css`, aggiorna la versione della cache nel service worker per forzare il re-download sui browser che hanno già installato l'app:

```js
// sw.js — riga 8
const CACHE_VERSION = 'v1.0.1'; // ← incrementa qui
```

Gli utenti vedranno automaticamente un banner "Aggiornamento disponibile" con un bottone per ricaricare.

---

## Hosting su GitHub Pages

1. Vai su **Settings → Pages** nel repository
2. Source: `Deploy from a branch` → `main` → `/ (root)`
3. Salva — l'app sarà disponibile su `https://tuonome.github.io/dealradar/`

> Il service worker richiede HTTPS, che GitHub Pages fornisce automaticamente.

---

## Tecnologie

- HTML / CSS / JavaScript vanilla — nessun framework, nessun build step
- [Chart.js](https://www.chartjs.org/) — grafici storici prezzi
- [Bootstrap Icons](https://icons.getbootstrap.com/) — icone UI
- Web Storage API — tutti i dati salvati in `localStorage`, nessun server
- Service Worker API — supporto offline e installazione PWA

---

## Licenza

MIT
