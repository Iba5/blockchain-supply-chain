import { useState, useEffect } from "react";
import { getContract } from "../utils/contract";
import { addressUrl } from "../utils/network";
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

const truncate = (value) => `${value.slice(0, 6)}...${value.slice(-4)}`;

export default function PendingTransfers() {
  const { currentRole } = useRole();
  const [ownedProducts, setOwnedProducts] = useState([]);
  const [movedProducts, setMovedProducts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userAddress, setUserAddress] = useState("");

  useEffect(() => {
    loadUserAddress();
  }, []);

  useEffect(() => {
    if (userAddress) {
      loadOwnedProducts();
    }
  }, [userAddress]);

  const loadUserAddress = async () => {
    try {
      if (window.ethereum) {
        const { BrowserProvider } = await import("ethers");
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setUserAddress(await signer.getAddress());
      }
    } catch (err) {
      console.error("Error loading user address:", err);
    }
  };

  const loadOwnedProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const contract = await getContract();
      const productIds = await contract.getProductsByOwner(userAddress);
      
      const products = await Promise.all(
        productIds.map(async (id) => {
          const product = await contract.getProduct(id);
          return product;
        })
      );
      
      setOwnedProducts(products);
      
      // Clear moved products set when products are reloaded
      // This allows moving products again after they've been updated
      setMovedProducts(new Set());
    } catch (err) {
      setError(err.message);
      setOwnedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const moveToNextStage = async (productId, currentStage) => {
    try {
      setError("");
      
      // Check if product is currently being processed
      if (movedProducts.has(productId)) {
        return; // Already processing, ignore duplicate click
      }

      const contract = await getContract();
      const nextStage = currentStage + 1;
      
      if (nextStage > 6) {
        setError("Product is already at final stage (Sold)");
        return;
      }

      // Mark as being processed to prevent duplicate clicks
      setMovedProducts(prev => new Set([...prev, productId]));

      // For demo purposes, transfer to self with next stage
      const tx = await contract.transferProduct(
        productId, 
        userAddress, 
        nextStage, 
        "Stage progression"
      );
      await tx.wait();
      
      // Reload products to get updated state
      await loadOwnedProducts();
      
    } catch (err) {
      // Remove from moved set if transaction failed
      setMovedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      setError(err.message);
    }
  };

  const getNextStageLabel = (currentStage) => {
    const nextStage = currentStage + 1;
    if (nextStage < stageLabels.length) {
      return stageLabels[nextStage];
    }
    return "Final Stage";
  };

  const getNextStageIcon = (currentStage) => {
    const nextStage = currentStage + 1;
    if (nextStage < stageLabels.length) {
      return stageIcons[nextStage];
    }
    return "🏁";
  };

  return (
    <section className="panel professional-form">
      <div className="form-header">
        <div className="form-title">
          <span className="form-icon">📋</span>
          <div>
            <h2>Stage Progression</h2>
            <p>Move products through supply chain stages</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={loadOwnedProducts}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner"></span>
          <span>Loading your products...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && ownedProducts.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>No products found. Create a product first to manage stages.</p>
        </div>
      )}

      {!loading && !error && ownedProducts.length > 0 && (
        <div className="transfers-list">
          {ownedProducts.map((product) => (
            <div key={product.id} className="transfer-card">
              <div className="transfer-header">
                <div className="product-info">
                  <span className="product-id">Product #{product.id}</span>
                  <span className="product-name">{product.name}</span>
                </div>
                <div className="transfer-status">
                  <div className="role-badge small">
                    <span>{currentRole.icon}</span>
                    <span>{currentRole.name}</span>
                  </div>
                  <span className="status-badge acknowledged">
                    {stageIcons[Number(product.currentStage)]} {stageLabels[Number(product.currentStage)]}
                  </span>
                </div>
              </div>

              <div className="transfer-details">
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{product.description}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Manufacturer:</span>
                  <a 
                    href={addressUrl(product.manufacturer)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="detail-link"
                  >
                    {truncate(product.manufacturer)}
                  </a>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">
                    {new Date(Number(product.timestamp) * 1000).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="transfer-actions">
                {Number(product.currentStage) < 6 && (
                  <button 
                    className={`btn-primary ${movedProducts.has(product.id) ? 'disabled' : ''}`}
                    onClick={() => moveToNextStage(product.id, Number(product.currentStage))}
                    disabled={movedProducts.has(product.id)}
                  >
                    {movedProducts.has(product.id) ? (
                      <>⏳ Processing...</>
                    ) : (
                      <>{getNextStageIcon(Number(product.currentStage))} Move to {getNextStageLabel(Number(product.currentStage))}</>
                    )}
                  </button>
                )}
                {Number(product.currentStage) === 6 && (
                  <span className="completion-badge">✅ Product Journey Complete</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}