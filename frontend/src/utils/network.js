import deployed from "./deployedContract.json";

export const NETWORK_NAME = "Sepolia Testnet";
export const EXPLORER_BASE_URL = "https://sepolia.etherscan.io";
export const CONTRACT_ADDRESS = deployed.address;

export function txUrl(hash) {
  return `${EXPLORER_BASE_URL}/tx/${hash}`;
}

export function addressUrl(address) {
  return `${EXPLORER_BASE_URL}/address/${address}`;
}
