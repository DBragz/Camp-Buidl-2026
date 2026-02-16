# Event Counter (Web Frontend)

A small web app that listens for the **ThresholdReached** event from the [Counter](../event-counter-block) smart contract. It shows the counter’s name, description, current value, and threshold in a clear layout; when the contract emits the event, a celebration overlay with confetti appears.

**Authors:** DBrags and Cursor AI

---

## Requirements

- A **modern browser** (Chrome, Firefox, Edge, etc.).
- **Optional:** [Node.js](https://nodejs.org/) (for serving the app locally and avoiding `file://` restrictions).
- A **deployed Counter contract address** (from the [event-counter-block](../event-counter-block) project).
- For live networks (e.g. Sepolia): an **RPC URL** that supports browser CORS (e.g. [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/)). Using `https://rpc.sepolia.org` from a page on `localhost` can be blocked by CORS; Alchemy/Infura Sepolia URLs usually work.
- To use **Connect wallet** and **Increment**: a browser wallet (e.g. [MetaMask](https://metamask.io/)) and Sepolia ETH on the same network as the contract.

---

## Project layout

```
event-counter-web/
├── README.md
└── frontend/
    ├── index.html   # Single-page app (HTML only; assets linked)
    ├── styles.css   # All styles
    └── script.js   # Contract connection, event listener, UI logic (ethers.js from CDN)
```

No build step; the app uses vanilla HTML, CSS, and JavaScript with ethers.js loaded from a CDN.

---

## Commands (how to run the app)

All commands assume you are in the **project root** (`event-counter-web/`) unless stated otherwise.

### Option 1: Local server with Node (recommended)

Serve the `frontend` folder so the app is at `http://localhost:3000`:

```bash
cd event-counter-web
npx serve@latest frontend
```

Then open **http://localhost:3000** in your browser.

If you see *"could not determine executable to run"*, use the explicit package version above. To use a different port:

```bash
npx serve@latest frontend -l 5000
```

Then open **http://localhost:5000**.

---

### Option 2: Python HTTP server

From the **event-counter-web** directory:

```bash
python -m http.server 3000 --directory frontend
```

Then open **http://localhost:3000** in your browser.

---

### Option 3: Open the file directly

Double-click `frontend/index.html` in File Explorer, or from the project root:

```bash
# Windows
start frontend\index.html
```

Some features (e.g. RPC calls) may work better with a local server due to CORS.

---

### Option 4: Other static servers

- **VS Code / Cursor:** “Live Server” extension — open `frontend/index.html` and click “Go Live”.
- **PHP:** `php -S localhost:3000 -t frontend` (from project root).
- **Global serve:** `npm install -g serve` then `serve frontend`.

---

## Using the app

1. **Run the app** (e.g. `npx serve@latest frontend` then open http://localhost:3000).
2. **Counter contract address:** Paste the deployed Counter contract address (from [event-counter-block](../event-counter-block)) into “Counter contract address”.
3. **RPC URL (optional):** For Sepolia, use an Alchemy or Infura Sepolia URL to avoid CORS. Leave blank to use the default public Sepolia RPC (may hit CORS from the browser).
4. **Start listening:** Click **Start listening**. The page fetches and displays **Name**, **Description**, **Current value**, and **Threshold** from the contract.
5. **Event:** The animation and “Event triggered!” status are driven **only** by the contract’s **ThresholdReached** event (not by comparing number to threshold in the browser). When the event is emitted, a full-screen celebration overlay with confetti appears; click **Dismiss** to close it.
6. **Connect wallet:** Click **Connect wallet** to connect MetaMask (or another injected wallet). Then **Increment** sends an `increment()` transaction so you can reach the threshold from the UI.

---

## Summary

| Goal              | Command or action |
|-------------------|-------------------|
| Run (recommended) | `npx serve@latest frontend` then open http://localhost:3000 |
| Run (Python)      | `python -m http.server 3000 --directory frontend` then open http://localhost:3000 |
| Open file         | Open `frontend/index.html` in the browser (or `start frontend\index.html` on Windows) |
| Avoid CORS        | Use an Alchemy or Infura Sepolia RPC URL in the “RPC URL” field |

No build step is required. For production, host the `frontend` folder on a static host (e.g. Vercel, Netlify, GitHub Pages) and keep RPC URLs in env or config.
