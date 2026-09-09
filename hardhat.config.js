import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const networks = {
  hardhat: {
    chainId: 1337
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 1337
  }
};

// Only add sepolia network if env vars are present
if (process.env.SEPOLIA_RPC_URL && process.env.PRIVATE_KEY) {
  networks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  };
}

export default {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks
};
