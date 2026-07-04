import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { getContract } from "../utils/contract";

const stageLabels = [
  "Manufactured",
  "Quality Check",
  "Shipped",
  "In Transit",
  "At Warehouse",
  "At Retailer",
  "Sold"
];

const stageClass = (stage) => `stage stage-${stage}`;

const truncate = (value) => `${value.slice(0, 6)}...${value.slice(-4)}`;

export default function Dashboard({ onOwnedProductsChange }) {
  const [account, setAccount] = useState("");
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("Connect MetaMask to load products.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = async (walletAddress) => {
    setLoading(true);
    try {
      const contract = await getContract();
      const ids = await contract.getProductsByOwner(walletAddress);
      const records = await Promise.all(
        ids.map(async (id) => {
          const product = await contract.getProduct(id);
          return {
            id: id.toString(),
            name: product.name,
            stage: Number(product.currentStage),
            owner: product.currentOwner,
            timestamp: Number(product.timestamp)
          };
        })
      );
      setProducts(records);
      onOwnedProductsChange?.(records.map((product) => product.id));
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setError("");
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const nextAccount = accounts[0];
      setAccount(nextAccount);
      await loadProducts(nextAccount);
      setStatus("Wallet connected.");
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = async (accounts) => {
      if (!accounts.length) {
        setAccount("");
        setProducts([]);
        return;
      }
      setAccount(accounts[0]);
      await loadProducts(accounts[0]);
    };
    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts?.length) {
        setAccount(accounts[0]);
        loadProducts(accounts[0]).catch((err) => setError(err.message));
      }
    });
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Dashboard</h2>
          <p>{account ? `Connected: ${truncate(account)}` : status}</p>
        </div>
        <button className="primary" onClick={connectWallet}>
          Connect Wallet
        </button>
      </div>

      {loading ? <p>Loading products...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="card-grid">
        {products.map((product) => (
          <article key={product.id} className="card">
            <div className={stageClass(product.stage)}>{stageLabels[product.stage]}</div>
            <h3>{product.name}</h3>
            <p>ID: {product.id}</p>
            <p>Owner: {truncate(product.owner)}</p>
            <p>Updated: {new Date(product.timestamp * 1000).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
