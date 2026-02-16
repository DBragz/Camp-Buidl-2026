# Event Counter (Smart Contract)

A Solidity counter contract with a configurable **name**, **description**, and **threshold**. When the counter reaches the threshold, it emits a `ThresholdReached` event so off-chain apps (e.g. a website) can react.

**Authors:** DBrags and Cursor AI

---

## Requirements

- **Foundry** (Forge, Anvil, Cast)  
  Install: https://book.getfoundry.sh/getting-started/installation  
  - `forge` — build and test  
  - `anvil` — local Ethereum node (optional)  
  - `cast` — send transactions and call contracts (optional)
- A **private key** for deployment and sending transactions (e.g. from MetaMask; use a test wallet).
- For public networks (e.g. Sepolia): **Sepolia ETH** from a faucet and an **RPC URL** (e.g. from [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/)).

---

## Project layout

```
event-counter-block/
├── foundry.toml
├── src/
│   └── Counter.sol      # Counter contract
├── script/
│   └── Counter.s.sol   # Deployment script
└── test/
    └── Counter.t.sol   # Tests
```

---

## Commands

All commands are intended to be run from the **project root** (`event-counter-block/`).

### Build (compile)

```bash
forge build
```

Compiles all contracts under `src/`.

---

### Test

Run all tests:

```bash
forge test
```

Run with extra logs:

```bash
forge test -vv
```

Run only the Counter tests:

```bash
forge test --match-path test/Counter.t.sol -vv
```

---

### Local chain (optional)

Start a local Anvil node (keep it running in one terminal):

```bash
anvil
```

Use the default RPC URL `http://127.0.0.1:8545` and one of the printed private keys for the next steps.

---

### Deploy with Forge Create

Deploy the `Counter` contract. Replace `YOUR_RPC_URL` and `YOUR_PRIVATE_KEY`. Use constructor args: **name**, **description**.

**Local (Anvil):**

```bash
forge create src/Counter.sol:Counter \
  --rpc-url http://127.0.0.1:8545 \
  --private-key YOUR_PRIVATE_KEY \
  --constructor-args "My Counter" "Description of the counter"
```

**Sepolia (use an Alchemy or Infura Sepolia RPC URL):**

```bash
forge create src/Counter.sol:Counter \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY \
  --private-key YOUR_PRIVATE_KEY \
  --constructor-args "My Counter" "Description of the counter"
```

The last line of the output (or the `deployedTo` field in JSON output) is the **contract address**. Save it for the frontend and for `cast` commands.

---

### Deploy with Forge Script

**Local (Anvil must be running):**

```bash
forge script script/Counter.s.sol:CounterScript \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key YOUR_PRIVATE_KEY
```

**Sepolia:**

```bash
forge script script/Counter.s.sol:CounterScript \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY \
  --broadcast \
  --private-key YOUR_PRIVATE_KEY
```

The deployed contract address appears in the terminal or in `broadcast/.../run-latest.json` under the creation transaction.

---

### Interact with Cast

Replace `CONTRACT_ADDRESS`, `RPC_URL`, and `PRIVATE_KEY` with your values.

**Set the threshold:**

```bash
cast send CONTRACT_ADDRESS "setThreshold(uint256)" 10 \
  --rpc-url RPC_URL \
  --private-key PRIVATE_KEY
```

**Increment:**

```bash
cast send CONTRACT_ADDRESS "increment()" \
  --rpc-url RPC_URL \
  --private-key PRIVATE_KEY
```

**Set number directly:**

```bash
cast send CONTRACT_ADDRESS "setNumber(uint256)" 5 \
  --rpc-url RPC_URL \
  --private-key PRIVATE_KEY
```

**Read only (no key needed):**

```bash
cast call CONTRACT_ADDRESS "number()" --rpc-url RPC_URL
cast call CONTRACT_ADDRESS "name()" --rpc-url RPC_URL
cast call CONTRACT_ADDRESS "description()" --rpc-url RPC_URL
cast call CONTRACT_ADDRESS "threshold()" --rpc-url RPC_URL
```

---

## Summary

| Goal           | Command |
|----------------|--------|
| Compile        | `forge build` |
| Test           | `forge test` or `forge test --match-path test/Counter.t.sol -vv` |
| Local node     | `anvil` |
| Deploy         | `forge create src/Counter.sol:Counter --rpc-url <RPC> --private-key <KEY> --constructor-args "Name" "Description"` |
| Deploy (script)| `forge script script/Counter.s.sol:CounterScript --rpc-url <RPC> --broadcast --private-key <KEY>` |
| Set threshold  | `cast send <ADDR> "setThreshold(uint256)" <N> --rpc-url <RPC> --private-key <KEY>` |
| Increment      | `cast send <ADDR> "increment()" --rpc-url <RPC> --private-key <KEY>` |
| Read state     | `cast call <ADDR> "number()" --rpc-url <RPC>` |

Use the deployed contract address in the **event-counter-web** frontend to listen for `ThresholdReached` and display the counter.
