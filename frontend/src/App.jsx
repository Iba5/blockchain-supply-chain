import { useState } from "react";
import Dashboard from "./components/Dashboard";
import AddProduct from "./components/AddProduct";
import TransferProduct from "./components/TransferProduct";
import ProductHistory from "./components/ProductHistory";

export default function App() {
  const [ownedProductIds, setOwnedProductIds] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((value) => value + 1);

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Blockchain Supply Chain Management</p>
        <h1>Track products from manufacturing to sale.</h1>
        <p className="lede">
          Connect MetaMask, create products, transfer ownership, and inspect the full on-chain history.
        </p>
      </header>

      <Dashboard
        key={refreshKey}
        onOwnedProductsChange={setOwnedProductIds}
      />

      <div className="grid-2">
        <AddProduct onCreated={refresh} />
        <TransferProduct ownedProductIds={ownedProductIds} onTransferred={refresh} />
      </div>

      <ProductHistory />
    </main>
  );
}
