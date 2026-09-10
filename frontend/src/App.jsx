import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import AddProduct from "./components/AddProduct";
import TransferProduct from "./components/TransferProduct";
import ProductHistory from "./components/ProductHistory";
import NetworkBadge from "./components/NetworkBadge";
import { RoleProvider } from "./contexts/RoleContext";
import Sidebar from "./components/Sidebar";
import ProfessionalDashboard from "./components/ProfessionalDashboard";
import RoleManagement from "./components/RoleManagement";
import Analytics from "./components/Analytics";
import { BrowserProvider } from "ethers";

export default function App() {
  const [ownedProductIds, setOwnedProductIds] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      console.log("MetaMask not installed");
    }
  };

  const refresh = () => setRefreshKey((value) => value + 1);

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <ProfessionalDashboard />;
      case 'products':
        return <Dashboard key={refreshKey} onOwnedProductsChange={setOwnedProductIds} />;
      case 'create':
        return <AddProduct onCreated={refresh} />;
      case 'transfer':
        return <TransferProduct ownedProductIds={ownedProductIds} onTransferred={refresh} />;
      case 'history':
        return <ProductHistory />;
      case 'analytics':
        return <Analytics />;
      case 'roles':
        return <RoleManagement />;
      default:
        return <ProfessionalDashboard />;
    }
  };

  return (
    <RoleProvider>
      <div className="app-layout">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} account={account} isConnected={isConnected} onConnect={connectWallet} />
        <div className="main-content">
          <div className="content-scroll">
            <NetworkBadge />
            {!isConnected && (
              <div className="wallet-connect-prompt">
                <div className="wallet-connect-card">
                  <h2>Connect Your Wallet</h2>
                  <p>Connect your MetaMask wallet to access Supply Ledger</p>
                  <button onClick={connectWallet} className="primary">Connect Wallet</button>
                </div>
              </div>
            )}
            {isConnected && renderPage()}
          </div>
        </div>
      </div>
    </RoleProvider>
  );
}
