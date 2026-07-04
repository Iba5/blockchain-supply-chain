import { useState } from "react";
import { getContract } from "../utils/contract";

export default function AddProduct({ onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [txHash, setTxHash] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.createProduct(name, description);
      setTxHash(tx.hash);
      await tx.wait();
      setMessage("Product created successfully.");
      setName("");
      setDescription("");
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Add Product</h2>
      <form onSubmit={handleSubmit} className="stack">
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
        <button className="primary" type="submit">
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
      {txHash ? <p>Tx Hash: {txHash}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
