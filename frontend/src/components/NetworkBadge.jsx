import { NETWORK_NAME, CONTRACT_ADDRESS, addressUrl } from "../utils/network";

const truncate = (value) => `${value.slice(0, 6)}...${value.slice(-4)}`;

export default function NetworkBadge() {
  return (
    <div className="network-badge-enhanced">
      <div className="network-indicator">
        <span className="status-dot online"></span>
        <span className="network-name">Live on {NETWORK_NAME}</span>
      </div>
      <div className="network-separator">•</div>
      <a 
        href={addressUrl(CONTRACT_ADDRESS)} 
        target="_blank" 
        rel="noopener noreferrer"
        className="network-contract-link"
      >
        <span className="contract-icon">🔗</span>
        <span className="contract-address">{truncate(CONTRACT_ADDRESS)}</span>
      </a>
    </div>
  );
}
