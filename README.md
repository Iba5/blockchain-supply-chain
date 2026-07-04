# Blockchain Supply Chain Management

## Overview
This project tracks product movement across a supply chain on Ethereum. It records product creation, ownership transfer, stage changes, timestamps, and locations on-chain.

It is intended for verified product traceability. The contract preserves an immutable history of each product lifecycle step.

## Tech Stack
- Solidity 0.8.24
- Hardhat and `@nomicfoundation/hardhat-toolbox`
- Ethers.js v6
- React and Vite
- MetaMask

## Prerequisites
- Node.js v18+ (tested on v24.18.0)
- MetaMask browser extension
- Git

## Project Structure
```text
supplychain/
├── contracts/
│   └── SupplyChain.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── SupplyChain.test.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddProduct.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProductHistory.jsx
│   │   │   └── TransferProduct.jsx
│   │   ├── utils/
│   │   │   ├── contract.js
│   │   │   └── deployedContract.json
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── hardhat.config.js
├── package.json
└── README.md
```

## Setup and Running

### 1. Install dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Compile the contract
```bash
npx hardhat compile
```

### 3. Run tests
```bash
npx hardhat test
```

### 4. Start local node
```bash
npx hardhat node
```
Keep this terminal open.

### 5. Deploy contract
```bash
npm run deploy:local
```
This writes the deployed address and ABI to `frontend/src/utils/deployedContract.json` automatically.

### 6. Start frontend
```bash
cd frontend && npm run dev
```
Open http://localhost:5173

### 7. Configure MetaMask
- Add network: RPC `http://127.0.0.1:8545`, Chain ID `1337`, Symbol `ETH`
- Import a test account using any private key printed by `npx hardhat node`
- Switch MetaMask to the Hardhat network before connecting wallet

## Using the App
- Dashboard: Connects MetaMask, shows the connected wallet, and lists products owned by that wallet.
- Add Product: Creates a new product with name and description and shows the transaction hash.
- Transfer Product: Transfers an owned product to another wallet and records the new stage and location.
- Product History: Searches a product by ID and shows its on-chain timeline.

## Smart Contract
| Function | Parameters | Description | Access |
| --- | --- | --- | --- |
| `createProduct` | `name`, `description` | Creates a new product and records the initial manufacturer history entry. | Any connected wallet |
| `transferProduct` | `productId`, `newOwner`, `newStage`, `location` | Transfers a product and appends a new history entry. | Current owner only |
| `getProduct` | `id` | Returns the full `Product` struct for a product ID. | Read-only |
| `getProductHistory` | `id` | Returns the full `HistoryEntry[]` timeline for a product ID. | Read-only |
| `getProductsByOwner` | `address` | Returns the product IDs currently owned by the given wallet. | Read-only |

Events:
- `ProductCreated(uint256 indexed id, string name, address indexed manufacturer)`
- `ProductTransferred(uint256 indexed id, address indexed from, address indexed to, Stage newStage)`

## Testing
Run:
```bash
npx hardhat test
```

Expected result:
```text
5 passing
```

Test coverage:
- `createProduct` creates with correct owner and `Manufactured` stage
- `transferProduct` updates owner, stage, and history
- non-owner transfer attempts revert
- `getProductHistory` returns the correct number of entries
- `getProductsByOwner` returns correct IDs after ownership changes

## Important Notes
- `frontend/src/utils/deployedContract.json` is gitignored. Run `npm run deploy:local` after every fresh node start.
- Hardhat test accounts are publicly known. Do not use them on mainnet.
- The local Hardhat node resets on restart. All contract state is lost.
