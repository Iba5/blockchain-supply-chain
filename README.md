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

## Deploying to Sepolia

### 1. Set up environment variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- `SEPOLIA_RPC_URL`: Your Alchemy Sepolia RPC URL (e.g., `https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY`)
- `PRIVATE_KEY`: Your wallet private key (without the `0x` prefix)

### 2. Get Sepolia test ETH
Visit a Sepolia faucet to get test ETH for your wallet:
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

### 3. Deploy to Sepolia
```bash
npm run deploy:sepolia
```

This writes the deployed address and ABI to `frontend/src/utils/deployedContract.json`.

### 4. Configure MetaMask for Sepolia
- Add Sepolia network if not already configured:
  - RPC URL: `https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY`
  - Chain ID: `11155111`
  - Symbol: `ETH`
- Import your wallet using the private key from `.env`
- Switch MetaMask to Sepolia network before connecting wallet

## Demo Mode (No MetaMask Required)

Demo mode allows the frontend to run without MetaMask by using an embedded demo wallet. This is useful for testing or demonstrations when browser wallet extensions are not available.

### ⚠️ Security Warning
**Only use demo mode with a throwaway wallet that has no real funds.** The private key is bundled into the frontend JavaScript build and becomes publicly visible to anyone who inspects the code. Never use a wallet with real money or valuable assets in demo mode.

### Setting Up Demo Mode

1. Create a frontend environment file:
```bash
cd frontend
cp .env.example .env
```

2. Edit `frontend/.env` with your demo configuration:
```bash
VITE_DEMO_MODE=true
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
VITE_DEMO_PRIVATE_KEY=your_demo_wallet_private_key_without_0x_prefix
```

3. Start the frontend:
```bash
cd frontend
npm run dev
```

The app will automatically connect using the demo wallet and skip the "Connect Wallet" button. All contract interactions will use the embedded wallet address.

### Toggling Between Modes
- **Demo mode**: Set `VITE_DEMO_MODE=true` in `frontend/.env`
- **MetaMask mode**: Set `VITE_DEMO_MODE=false` (or omit the variable)

### Access Gate (Demo Protection)

The frontend includes an access gate to prevent random visitors from modifying demo data during presentations. This is a soft UX feature, not a security boundary.

#### How It Works
- Users must enter an access code before the app loads
- The code is validated client-side against `VITE_ACCESS_CODE`
- Once unlocked, the session is stored in sessionStorage (refreshing doesn't re-prompt)
- This gate does NOT protect against technical users who can inspect the code

#### Setting Up the Access Gate
1. Set your access code in `frontend/.env`:
```bash
VITE_ACCESS_CODE=your_presentation_code
```

2. When users visit the app, they'll see a password prompt
3. After entering the correct code, the full app loads

#### Security Note
This access gate is purely for demo integrity during presentations. It does NOT provide real security because:
- The demo wallet's private key is already bundled into the frontend build
- The access code is client-side validation
- Anyone with technical knowledge can bypass this by inspecting the code

Use this only for live presentations to prevent accidental demo data modification by random visitors, not for protecting valuable assets or real funds.

## Important Notes
- `frontend/src/utils/deployedContract.json` is gitignored. Run `npm run deploy:local` after every fresh node start.
- Hardhat test accounts are publicly known. Do not use them on mainnet.
- The local Hardhat node resets on restart. All contract state is lost.
- Never commit real private keys or API keys to the repository.
- Demo mode private keys are bundled into the frontend build and visible in client-side JavaScript. Only use throwaway wallets with no real funds.
