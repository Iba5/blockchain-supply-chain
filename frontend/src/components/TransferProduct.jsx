import { useState } from "react";
import { isAddress } from "ethers";
import { getContract } from "../utils/contract";
import { txUrl } from "../utils/network";
import { useRole } from "../contexts/RoleContext";

const stages = [
  { value: "Manufactured", label: "Manufactured", icon: "🏭" },
  { value: "QualityCheck", label: "Quality Check", icon: "✅" },
  { value: "Shipped", label: "Shipped", icon: "🚚" },
  { value: "InTransit", label: "In Transit", icon: "📦" },
  { value: "AtWarehouse", label: "At Warehouse", icon: "🏢" },
  { value: "AtRetailer", label: "At Retailer", icon: "🏪" },
  { value: "Sold", label: "Sold", icon: "💰" }
];

export default function TransferProduct({ ownedProductIds = [], onTransferred }) {
  const { currentRole } = useRole();
  const [productId, setProductId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [stage, setStage] = useState("Shipped");
  const [location, setLocation] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      setTxHash("");
      setTxStatus("");
      setBlockNumber("");
      if (!isAddress(recipient)) {
        throw new Error("Recipient address is not a valid Ethereum address");
      }
      setLoading(true);
      const contract = await getContract();
      const stageIndex = stages.findIndex(s => s.value === stage);
      const tx = await contract.transferProduct(productId, recipient, stageIndex, location);
      setTxHash(tx.hash);
      setTxStatus("Pending confirmation...");
      
      const receipt = await tx.wait();
      setTxStatus(`✅ Confirmed in block #${receipt.blockNumber}`);
      setBlockNumber(receipt.blockNumber);
      setMessage("Product transferred successfully.");
      onTransferred?.();
    } catch (err) {
      setError(err.message);
      setTxStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel professional-form">
      <div className="form-header">
        <div className="form-title">
          <span className="form-icon">🔄</span>
          <div>
            <h2>Transfer Product</h2>
            <p>Transfer ownership and update supply chain status</p>
          </div>
        </div>
        <div className="role-badge">
          <span>{currentRole.icon}</span>
          <span>{currentRole.name}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="professional-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Select Product *</label>
            <select 
              value={productId} 
              onChange={(event) => setProductId(event.target.value)} 
              required
            >
              <option value="">Select owned product</option>
              {ownedProductIds.map((id) => (
                <option key={id} value={id}>
                  Product #{id}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Recipient Address *</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Supply Chain Stage *</label>
            <select value={stage} onChange={(event) => setStage(event.target.value)}>
              {stages.map((stageOption) => (
                <option key={stageOption.value} value={stageOption.value}>
                  {stageOption.icon} {stageOption.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              placeholder="Current location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => {
            setProductId("");
            setRecipient("");
            setStage("Shipped");
            setLocation("");
          }}>
            Clear Form
          </button>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Transferring...
              </>
            ) : (
              <>
                <span>🔄</span>
                Transfer Product
              </>
            )}
          </button>
        </div>
      </form>

      {txHash && (
        <div className="transaction-status">
          <div className="status-header">
            <span className="status-icon">🔗</span>
            <h3>Transaction Details</h3>
          </div>
          <div className="status-content">
            <div className="status-row">
              <span className="status-label">Transaction Hash:</span>
              <a 
                href={txUrl(txHash)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="status-link"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
            {txStatus && (
              <div className="status-row">
                <span className="status-label">Status:</span>
                <span className="status-value">{txStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {message && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
