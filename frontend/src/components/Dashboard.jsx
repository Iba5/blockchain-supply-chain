import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { getContract } from "../utils/contract";
import { addressUrl, CONTRACT_ADDRESS } from "../utils/network";
import { useRole } from "../contexts/RoleContext";

const stageLabels = [
  "Manufactured",
  "Quality Check",
  "Shipped",
  "In Transit",
  "At Warehouse",
  "At Retailer",
  "Sold"
];

const stageIcons = {
  0: "🏭",
  1: "✅",
  2: "🚚",
  3: "📦",
  4: "🏢",
  5: "🏪",
  6: "💰"
};

const stageColors = {
  0: "#4CAF50",
  1: "#FFC107",
  2: "#2196F3",
  3: "#00BCD4",
  4: "#9C27B0",
  5: "#FF9800",
  6: "#F44336"
};

const truncate = (value) => `${value.slice(0, 6)}...${value.slice(-4)}`;

export default function Dashboard({ onOwnedProductsChange }) {
  const { currentRole } = useRole();
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
    // Normal MetaMask flow
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
    <section className="panel professional-dashboard-products">
      <div className="panel-header">
        <div className="header-content">
          <div className="form-title">
            <span className="form-icon">📦</span>
            <div>
              <h2>My Products</h2>
              <p>Manage your supply chain products</p>
            </div>
          </div>
          <div className="role-badge">
            <span>{currentRole.icon}</span>
            <span>{currentRole.name}</span>
          </div>
        </div>
        <div className="header-status">
          <div className="wallet-status">
            <span className="status-dot online"></span>
            <span>{account ? `Connected: ${truncate(account)}` : status}</span>
          </div>
          <button className="btn-primary" onClick={connectWallet}>
            <span>🔗</span> Connect Wallet
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="products-grid">
            {products.map((product) => (
              <article key={product.id} className="product-card">
                <div 
                  className="product-stage"
                  style={{ 
                    backgroundColor: `${stageColors[product.stage]}20`,
                    color: stageColors[product.stage]
                  }}
                >
                  <span className="stage-icon">{stageIcons[product.stage]}</span>
                  <span className="stage-label">{stageLabels[product.stage]}</span>
                </div>
                <div className="product-content">
                  <h3>{product.name}</h3>
                  <div className="product-details">
                    <div className="detail-item">
                      <span className="detail-label">ID:</span>
                      <span className="detail-value">#{product.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Owner:</span>
                      <a 
                        href={addressUrl(product.owner)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="detail-link"
                      >
                        {truncate(product.owner)}
                      </a>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Updated:</span>
                      <span className="detail-value">
                        {new Date(product.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {products.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <h3>No Products Found</h3>
              <p>You don't own any products yet. Create your first product to get started.</p>
            </div>
          )}
        </>
      )}

      <div className="contract-footer">
        <a 
          href={addressUrl(CONTRACT_ADDRESS)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="footer-link"
        >
          <span>🔗</span> View contract on Etherscan
        </a>
      </div>
    </section>
  );
}
