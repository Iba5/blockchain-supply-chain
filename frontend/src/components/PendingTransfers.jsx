import { useState, useEffect } from "react";
import { getContract } from "../utils/contract";
import { addressUrl, txUrl } from "../utils/network";
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
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userAddress, setUserAddress] = useState("");

  useEffect(() => {
    loadUserAddress();
  }, []);

  useEffect(() => {
    if (userAddress) {
      loadPendingTransfers();
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

  const loadPendingTransfers = async () => {
    try {
      setLoading(true);
      setError("");
      const contract = await getContract();
      const transferIds = await contract.getPendingTransfersForUser(userAddress);
      
      const transfers = await Promise.all(
        transferIds.map(async (id) => {
          const transfer = await contract.getPendingTransfer(id);
          const product = await contract.getProduct(id);
          return { ...transfer, product };
        })
      );
      
      setPendingTransfers(transfers);
    } catch (err) {
      setError(err.message);
      setPendingTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (productId) => {
    try {
      setError("");
      const contract = await getContract();
      const tx = await contract.acknowledgeTransfer(productId);
      await tx.wait();
      await loadPendingTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComplete = async (productId) => {
    try {
      setError("");
      const contract = await getContract();
      const tx = await contract.completeTransfer(productId);
      await tx.wait();
      await loadPendingTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = async (productId) => {
    try {
      setError("");
      const contract = await getContract();
      const tx = await contract.cancelTransfer(productId);
      await tx.wait();
      await loadPendingTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const isSender = (transfer) => transfer.from.toLowerCase() === userAddress.toLowerCase();
  const isRecipient = (transfer) => transfer.to.toLowerCase() === userAddress.toLowerCase();

  return (
    <section className="panel professional-form">
      <div className="form-header">
        <div className="form-title">
          <span className="form-icon">📋</span>
          <div>
            <h2>Pending Transfers</h2>
            <p>Manage your pending product transfers</p>
          </div>
        </div>
        <div className="role-badge">
          <span>{currentRole.icon}</span>
          <span>{currentRole.name}</span>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner"></span>
          <span>Loading pending transfers...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && pendingTransfers.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>No pending transfers found</p>
        </div>
      )}

      {!loading && !error && pendingTransfers.length > 0 && (
        <div className="transfers-list">
          {pendingTransfers.map((transfer, index) => (
            <div key={`${transfer.productId}-${index}`} className="transfer-card">
              <div className="transfer-header">
                <div className="product-info">
                  <span className="product-id">Product #{transfer.productId}</span>
                  <span className="product-name">{transfer.product.name}</span>
                </div>
                <div className="transfer-status">
                  {transfer.acknowledged ? (
                    <span className="status-badge acknowledged">✓ Acknowledged</span>
                  ) : (
                    <span className="status-badge pending">⏳ Pending Acknowledgment</span>
                  )}
                </div>
              </div>

              <div className="transfer-details">
                <div className="detail-row">
                  <span className="detail-label">From:</span>
                  <a 
                    href={addressUrl(transfer.from)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="detail-link"
                  >
                    {truncate(transfer.from)}
                  </a>
                </div>
                <div className="detail-row">
                  <span className="detail-label">To:</span>
                  <a 
                    href={addressUrl(transfer.to)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="detail-link"
                  >
                    {truncate(transfer.to)}
                  </a>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Stage:</span>
                  <span className="detail-value">
                    {stageIcons[Number(transfer.newStage)]} {stageLabels[Number(transfer.newStage)]}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{transfer.location}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Initiated:</span>
                  <span className="detail-value">
                    {new Date(Number(transfer.timestamp) * 1000).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="transfer-actions">
                {isRecipient(transfer) && !transfer.acknowledged && (
                  <button 
                    className="btn-primary"
                    onClick={() => handleAcknowledge(transfer.productId)}
                  >
                    ✅ Acknowledge Transfer
                  </button>
                )}
                {isSender(transfer) && transfer.acknowledged && (
                  <button 
                    className="btn-success"
                    onClick={() => handleComplete(transfer.productId)}
                  >
                    🎉 Complete Transfer
                  </button>
                )}
                {isSender(transfer) && !transfer.acknowledged && (
                  <button 
                    className="btn-danger"
                    onClick={() => handleCancel(transfer.productId)}
                  >
                    ❌ Cancel Transfer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}