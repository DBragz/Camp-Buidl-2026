# Event Counter (Web Frontend)

A small web app that listens for the **ThresholdReached** event from the [Counter](../event-counter-block) smart contract. It shows the counter’s name, description, and current value, and lets you connect a wallet and call **Increment** to trigger the threshold.

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
└── frontend/
    └── index.html   # Single-page app (HTML, CSS, JS; ethers.js from CDN)
```

---

## Commands (how to run the app)

All commands assume you are in the **project root** (`event-counter-web/`) unless stated otherwise.

### Option 1: Open the file directly

From the **event-counter-web** project root:

```bash
# Windows (Explorer)
start frontend\index.html

# Or double-click frontend/index.html in File Explorer
```

Or open `frontend/index.html` in your browser from the file system. Some features (e.g. strict CORS or mixed content) may work better with a local server.

---

### Option 2: Local server with Node (recommended)

Serve the `frontend` folder so the app is at `http://localhost:3000` (or similar):

```bash
npx serve frontend
```

Then open **http://localhost:3000** in your browser.

To use a specific port:

```bash
npx serve frontend -l 3000
```

If you don’t have `serve` and don’t want to install it globally, you can use:

```bash
npx --yes serve frontend
```

---

### Option 3: Python HTTP server

From the **event-counter-web** directory:

```bash
cd frontend
python -m http.server 3000
```

Then open **http://localhost:3000** in your browser.

From the project root (serving only `frontend`):

```bash
python -m http.server 3000 --directory frontend
```

---

### Option 4: Other static servers

Any static file server that serves the `frontend` folder will work, for example:

- **VS Code / Cursor:** “Live Server” extension, open `frontend/index.html` and “Go Live”.
- **PHP:** `php -S localhost:3000 -t frontend` (from project root).

---

## Using the app

1. **Run the app** using one of the commands above (e.g. `npx serve frontend` then open http://localhost:3000).
2. **Counter contract address:** Paste the deployed Counter contract address (from [event-counter-block](../event-counter-block)) into “Counter contract address”.
3. **RPC URL (optional):** For Sepolia, use an Alchemy or Infura Sepolia URL to avoid CORS (e.g. `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`). Leave blank to use the default public Sepolia RPC (may hit CORS when called from the browser).
4. **Start listening:** Click **Start listening**. The page will subscribe to the contract and show its name, description, and current `number`.
5. **Event:** When the contract emits **ThresholdReached** (because `number` reached `threshold`), the page shows “Event triggered!” and the `number` and `threshold` values.
6. **Connect wallet:** Click **Connect wallet** to connect MetaMask (or another injected wallet). After that, **Increment** will send an `increment()` transaction to the contract so you can trigger the threshold from the UI.

---

## Summary

| Goal              | Command or action |
|-------------------|--------------------|
| Run (recommended) | `npx serve frontend` then open http://localhost:3000 |
| Run (Python)       | `python -m http.server 3000 --directory frontend` then open http://localhost:3000 |
| Open file         | Open `frontend/index.html` in the browser (or `start frontend\index.html` on Windows) |
| Avoid CORS        | Use an Alchemy or Infura Sepolia RPC URL in the “RPC URL” field |

No build step is required; the page loads ethers.js from a CDN. For production, consider hosting the `frontend` folder on a static host (e.g. Vercel, Netlify, GitHub Pages) and keeping RPC URLs in env or config.
