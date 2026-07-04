import { BrowserProvider, Contract } from "ethers";
import deployed from "./deployedContract.json";

export const CONTRACT_ADDRESS = deployed.address;
const ABI = deployed.abi;

export async function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  if (
    !CONTRACT_ADDRESS ||
    CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error("Contract address not configured — run deploy script first");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, ABI, signer);
}
