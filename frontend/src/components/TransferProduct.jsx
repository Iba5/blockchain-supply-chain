import { useState } from "react";
import { isAddress } from "ethers";
import { getContract } from "../utils/contract";

const stages = [
  "Manufactured",
  "QualityCheck",
  "Shipped",
  "InTransit",
  "AtWarehouse",
  "AtRetailer",
  "Sold"
];

export default function TransferProduct({ ownedProductIds = [], onTransferred }) {
  const [productId, setProductId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [stage, setStage] = useState("Shipped");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      if (!isAddress(recipient)) {
        throw new Error("Recipient address is not a valid Ethereum address");
      }
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.transferProduct(productId, recipient, stages.indexOf(stage), location);
      await tx.wait();
      setMessage("Product transferred successfully.");
      onTransferred?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Transfer Product</h2>
      <form onSubmit={handleSubmit} className="stack">
        <select value={productId} onChange={(event) => setProductId(event.target.value)} required>
          <option value="">Select Owned Product</option>
          {ownedProductIds.map((id) => (
            <option key={id} value={id}>
              Product #{id}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Recipient Wallet Address"
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          required
        />
        <select value={stage} onChange={(event) => setStage(event.target.value)}>
          {stages.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          required
        />
        <button className="primary" type="submit">
          {loading ? "Transferring..." : "Transfer Product"}
        </button>
      </form>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
