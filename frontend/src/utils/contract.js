import { BrowserProvider, Contract } from "ethers";
import deployed from "./deployedContract.json";

export const CONTRACT_ADDRESS = deployed.address;
const ABI = deployed.abi;

export async function getContract() {
  if (
    !CONTRACT_ADDRESS ||
    CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error("Contract address not configured — run deploy script first");
  }

  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, ABI, signer);
}

export async function getUserRole(userAddress) {
  const contract = await getContract();
  try {
    const role = await contract.getUserRole(userAddress);
    return role;
  } catch (error) {
    console.error("Error getting user role:", error);
    return 0; // None role
  }
}

export async function assignRole(userAddress, role) {
  const contract = await getContract();
  try {
    const tx = await contract.assignRole(userAddress, role);
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Error assigning role:", error);
    throw error;
  }
}

export async function getAllProductIds() {
  const contract = await getContract();
  try {
    const ids = await contract.getAllProductIds();
    return ids;
  } catch (error) {
    console.error("Error getting all product IDs:", error);
    return [];
  }
}

export async function getTotalProducts() {
  const contract = await getContract();
  try {
    const total = await contract.getTotalProducts();
    return total;
  } catch (error) {
    console.error("Error getting total products:", error);
    return 0;
  }
}
