import { useState } from "react";
import { getContract } from "../utils/contract";

const labels = [
  "Manufactured",
  "Quality Check",
  "Shipped",
  "In Transit",
  "At Warehouse",
  "At Retailer",
  "Sold"
];

const truncate = (value) => `${value.slice(0, 6)}...${value.slice(-4)}`;

export default function ProductHistory() {
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
    <section className="panel">
      <h2>Product History</h2>
      <form onSubmit={searchHistory} className="stack">
        <input
          type="number"
          min="0"
          placeholder="Search by Product ID"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          required
        />
        <button className="primary" type="submit">
          {loading ? "Searching..." : "Search History"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <div className="timeline">
        {history.map((entry, index) => (
          <div key={`${entry.timestamp}-${index}`} className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <strong>{labels[Number(entry.stage)]}</strong>
              <p>Actor: {truncate(entry.actor)}</p>
              <p>Time: {new Date(Number(entry.timestamp) * 1000).toLocaleString()}</p>
              <p>Location: {entry.location}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
