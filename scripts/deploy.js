import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();
  const address = await supplyChain.getAddress();

  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/SupplyChain.sol/SupplyChain.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const outPath = path.join(__dirname, "../frontend/src/utils/deployedContract.json");
  fs.writeFileSync(outPath, JSON.stringify({ address, abi: artifact.abi }, null, 2));

  console.log(`Contract deployed to: ${address}`);
  console.log(`Frontend config updated.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
