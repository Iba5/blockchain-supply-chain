import { useState } from "react";
import { getContract } from "../utils/contract";
import { txUrl } from "../utils/network";
import { useRole } from "../contexts/RoleContext";

export default function AddProduct({ onCreated }) {
  const { currentRole, hasPermission } = useRole();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Check if user has permission to create products
    if (!hasPermission('create_product')) {
      setError("You don't have permission to create products. Only Manufacturers can create products.");
      return;
    }
    
    try {
      setError("");
      setMessage("");
      setTxHash("");
      setTxStatus("");
      setBlockNumber("");
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.createProduct(name, description);
      setTxHash(tx.hash);
      setTxStatus("Pending confirmation...");
      
      const receipt = await tx.wait();
      setTxStatus(`✅ Confirmed in block #${receipt.blockNumber}`);
      setBlockNumber(receipt.blockNumber);
      setMessage("Product created successfully.");
      setName("");
      setDescription("");
      onCreated?.();
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
          <span className="form-icon">📦</span>
          <div>
            <h2>Create New Product</h2>
            <p>Register a new product on the blockchain</p>
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
            <label>Product Name *</label>
            <input
              type="text"
              placeholder="Enter product name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Select category</option>
              <option value="electronics">Electronics</option>
              <option value="food">Food & Beverages</option>
              <option value="pharmaceutical">Pharmaceutical</option>
              <option value="automotive">Automotive</option>
              <option value="textile">Textile</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Manufacturer</label>
            <input
              type="text"
              placeholder="Manufacturer name"
              value={manufacturer}
              onChange={(event) => setManufacturer(event.target.value)}
            />
          </div>

          <div className="form-group full-width">
            <label>Description *</label>
            <textarea
              placeholder="Detailed product description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => {
            setName("");
            setDescription("");
            setCategory("");
            setManufacturer("");
          }}>
            Clear Form
          </button>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Product...
              </>
            ) : (
              <>
                <span>➕</span>
                Create Product
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
