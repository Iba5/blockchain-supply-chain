import { useState } from "react";
import { getContract } from "../utils/contract";
import { addressUrl } from "../utils/network";
import { useRole } from "../contexts/RoleContext";

const labels = [
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

export default function ProductHistory() {
  const { currentRole } = useRole();
  const [productId, setProductId] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchHistory = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setLoading(true);
      const contract = await getContract();
      const entries = await contract.getProductHistory(productId);
      setHistory(entries);
    } catch (err) {
      setHistory([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel professional-form">
      <div className="form-header">
        <div className="form-title">
          <span className="form-icon">📜</span>
          <div>
            <h2>Product History</h2>
            <p>Track complete supply chain journey</p>
          </div>
        </div>
        <div className="role-badge">
          <span>{currentRole.icon}</span>
          <span>{currentRole.name}</span>
        </div>
      </div>

      <form onSubmit={searchHistory} className="professional-form">
        <div className="form-group">
          <label>Product ID *</label>
          <input
            type="number"
            min="0"
            placeholder="Enter product ID"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Searching...
              </>
            ) : (
              <>
                <span>🔍</span>
                Search History
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {history.length > 0 && (
        <div className="history-timeline">
          <div className="timeline-header">
            <h3>Supply Chain Journey</h3>
            <span className="timeline-count">{history.length} events</span>
          </div>
          <div className="timeline">
            {history.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} className="timeline-item">
                <div className="timeline-dot">
                  <span className="stage-icon">{stageIcons[Number(entry.stage)]}</span>
                </div>
                <div className="timeline-content">
                  <div className="timeline-header-row">
                    <strong className="stage-label">{labels[Number(entry.stage)]}</strong>
                    <span className="timestamp">
                      {new Date(Number(entry.timestamp) * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="timeline-details">
                    <div className="detail-row">
                      <span className="detail-label">Actor:</span>
                      <a 
                        href={addressUrl(entry.actor)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="detail-link"
                      >
                        {truncate(entry.actor)}
                      </a>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{entry.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
