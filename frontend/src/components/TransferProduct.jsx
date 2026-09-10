import { useState } from "react";
import { isAddress } from "ethers";
import { getContract } from "../utils/contract";
import { txUrl } from "../utils/network";
import { useRole } from "../contexts/RoleContext";

const stages = [
  { value: "Manufactured", label: "Manufactured", icon: "🏭" },
  { value: "Quality Check", label: "Quality Check", icon: "✅" },
  { value: "Shipped", label: "Shipped", icon: "🚚" },
  { value: "In Transit", label: "In Transit", icon: "📦" },
  { value: "At Warehouse", label: "At Warehouse", icon: "🏢" },
  { value: "At Retailer", label: "At Retailer", icon: "🏪" },
  { value: "Sold", label: "Sold", icon: "💰" }
];

const locationSuggestions = {
  "Manufactured": ["Factory Floor", "Production Line", "Assembly Area", "Quality Control Lab"],
  "Quality Check": ["QA Laboratory", "Inspection Station", "Testing Facility", "Quality Center"],
  "Shipped": ["Distribution Center", "Shipping Dock", "Logistics Hub", "Warehouse Loading Bay"],
  "In Transit": ["Route A - Highway", "Route B - Local", "Customs Checkpoint", "Transit Hub"],
  "At Warehouse": ["Main Warehouse", "Storage Facility", "Distribution Center", "Inventory Hub"],
  "At Retailer": ["Retail Store Front", "Display Area", "Stock Room", "Sales Floor"],
  "Sold": ["Customer Location", "Delivery Address", "Final Destination", "End User Site"]
};

const commonAddresses = [
  { label: "Manufacturer A", address: "0x5B38Da6a709c396B2bC1c3D3f8E0C8E5B9A6D7F2" },
  { label: "Distributor Hub", address: "0x7B38Da6a709c396B2bC1c3D3f8E0C8E5B9A6D7F3" },
  { label: "Retailer Central", address: "0x8B38Da6a709c396B2bC1c3D3f8E0C8E5B9A6D7F4" },
  { label: "QA Facility", address: "0x9B38Da6a709c396B2bC1c3D3f8E0C8E5B9A6D7F5" }
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
      const tx = await contract.initiateTransfer(productId, recipient, stageIndex, location);
      setTxHash(tx.hash);
      setTxStatus("Pending confirmation...");
      
      const receipt = await tx.wait();
      setTxStatus(`✅ Transfer initiated! Waiting for recipient acknowledgment.`);
      setBlockNumber(receipt.blockNumber);
      setMessage("Transfer initiated successfully. The recipient will need to acknowledge this transfer before it can be completed.");
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
            <div className="address-input-group">
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                required
              />
              <select 
                className="address-suggestions"
                onChange={(event) => setRecipient(event.target.value)}
                value=""
              >
                <option value="">Quick Select...</option>
                {commonAddresses.map((addr, index) => (
                  <option key={index} value={addr.address}>
                    {addr.label} - {addr.address.slice(0, 8)}...{addr.address.slice(-6)}
                  </option>
                ))}
              </select>
            </div>
            {recipient && !isAddress(recipient) && (
              <span className="input-error">Invalid Ethereum address format</span>
            )}
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
            <div className="location-input-group">
              <input
                type="text"
                placeholder="Current location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
              />
              <select 
                className="location-suggestions"
                onChange={(event) => setLocation(event.target.value)}
                value=""
              >
                <option value="">Quick Select...</option>
                {(locationSuggestions[stage] || []).map((loc, index) => (
                  <option key={index} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <span className="input-hint">Suggestions based on {stage} stage</span>
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
