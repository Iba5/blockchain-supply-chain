// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SupplyChain {
    enum Role {
        None,
        Manufacturer,
        Distributor,
        Retailer,
        QualityAssurance,
        SupplyChainManager,
        Consumer
    }

    enum Stage {
        Manufactured,
        QualityCheck,
        Shipped,
        InTransit,
        AtWarehouse,
        AtRetailer,
        Sold
    }

    struct Product {
        uint256 id;
        string name;
        string description;
        address currentOwner;
        Stage currentStage;
        uint256 timestamp;
        address manufacturer;
    }

    struct HistoryEntry {
        address actor;
        Stage stage;
        uint256 timestamp;
        string location;
    }

    struct PendingTransfer {
        uint256 productId;
        address from;
        address to;
        Stage newStage;
        string location;
        uint256 timestamp;
        bool acknowledged;
    }

    uint256 private nextProductId;
    mapping(uint256 => Product) private products;
    mapping(uint256 => HistoryEntry[]) private productHistory;
    mapping(address => uint256[]) private ownerProducts;
    mapping(uint256 => bool) private productExists;
    mapping(address => Role) private userRoles;
    mapping(uint256 => PendingTransfer) private pendingTransfers;
    mapping(uint256 => bool) private hasPendingTransfer;
    address private admin;

    event ProductCreated(uint256 indexed id, string name, address indexed manufacturer);
    event ProductTransferred(uint256 indexed id, address indexed from, address indexed to, Stage newStage);
    event TransferInitiated(uint256 indexed productId, address indexed from, address indexed to, Stage newStage);
    event TransferAcknowledged(uint256 indexed productId, address indexed by);
    event TransferCompleted(uint256 indexed productId, address indexed from, address indexed to);
    event RoleAssigned(address indexed user, Role role);
    event RoleRevoked(address indexed user);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not admin");
        _;
    }

    modifier onlyRole(Role requiredRole) {
        require(userRoles[msg.sender] == requiredRole, "Caller does not have required role");
        _;
    }

    modifier onlyProductOwner(uint256 productId) {
        require(productExists[productId], "Product does not exist");
        require(msg.sender == products[productId].currentOwner, "Caller is not product owner");
        _;
    }

    modifier canTransfer() {
        Role userRole = userRoles[msg.sender];
        require(
            userRole == Role.Manufacturer || 
            userRole == Role.Distributor || 
            userRole == Role.Retailer ||
            userRole == Role.QualityAssurance ||
            userRole == Role.SupplyChainManager,
            "Caller cannot transfer products"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
        userRoles[msg.sender] = Role.SupplyChainManager;
    }

    function assignRole(address user, Role role) external onlyAdmin {
        userRoles[user] = role;
        emit RoleAssigned(user, role);
    }

    function revokeRole(address user) external onlyAdmin {
        userRoles[user] = Role.None;
        emit RoleRevoked(user);
    }

    function getUserRole(address user) external view returns (Role) {
        return userRoles[user];
    }

    function createProduct(string calldata name, string calldata description) external onlyRole(Role.Manufacturer) returns (uint256) {
        require(bytes(name).length > 0, "Name is required");

        uint256 productId = nextProductId++;
        Product storage product = products[productId];

        product.id = productId;
        product.name = name;
        product.description = description;
        product.currentOwner = msg.sender;
        product.currentStage = Stage.Manufactured;
        product.timestamp = block.timestamp;
        product.manufacturer = msg.sender;

        productExists[productId] = true;
        ownerProducts[msg.sender].push(productId);
        productHistory[productId].push(
            HistoryEntry({
                actor: msg.sender,
                stage: Stage.Manufactured,
                timestamp: block.timestamp,
                location: "Manufacturer"
            })
        );

        emit ProductCreated(productId, name, msg.sender);
        return productId;
    }

    function initiateTransfer(
        uint256 productId,
        address newOwner,
        Stage newStage,
        string calldata location
    ) external onlyProductOwner(productId) canTransfer {
        require(newOwner != address(0), "New owner is zero address");
        require(!hasPendingTransfer[productId], "Product already has pending transfer");

        pendingTransfers[productId] = PendingTransfer({
            productId: productId,
            from: msg.sender,
            to: newOwner,
            newStage: newStage,
            location: location,
            timestamp: block.timestamp,
            acknowledged: false
        });
        hasPendingTransfer[productId] = true;

        emit TransferInitiated(productId, msg.sender, newOwner, newStage);
    }

    function acknowledgeTransfer(uint256 productId) external {
        require(hasPendingTransfer[productId], "No pending transfer for this product");
        PendingTransfer storage transfer = pendingTransfers[productId];
        require(msg.sender == transfer.to, "Only recipient can acknowledge");
        require(!transfer.acknowledged, "Transfer already acknowledged");

        transfer.acknowledged = true;
        emit TransferAcknowledged(productId, msg.sender);
    }

    function completeTransfer(uint256 productId) external {
        require(hasPendingTransfer[productId], "No pending transfer for this product");
        PendingTransfer storage transfer = pendingTransfers[productId];
        require(transfer.acknowledged, "Transfer must be acknowledged first");
        require(msg.sender == transfer.from, "Only sender can complete transfer");

        address previousOwner = products[productId].currentOwner;
        _removeOwnerProduct(previousOwner, productId);

        products[productId].currentOwner = transfer.to;
        products[productId].currentStage = transfer.newStage;
        products[productId].timestamp = block.timestamp;
        ownerProducts[transfer.to].push(productId);
        productHistory[productId].push(
            HistoryEntry({
                actor: msg.sender,
                stage: transfer.newStage,
                timestamp: block.timestamp,
                location: transfer.location
            })
        );

        delete pendingTransfers[productId];
        hasPendingTransfer[productId] = false;

        emit TransferCompleted(productId, previousOwner, transfer.to);
        emit ProductTransferred(productId, previousOwner, transfer.to, transfer.newStage);
    }

    function cancelTransfer(uint256 productId) external {
        require(hasPendingTransfer[productId], "No pending transfer for this product");
        PendingTransfer storage transfer = pendingTransfers[productId];
        require(msg.sender == transfer.from, "Only sender can cancel transfer");

        delete pendingTransfers[productId];
        hasPendingTransfer[productId] = false;
    }

    function getPendingTransfer(uint256 productId) external view returns (PendingTransfer memory) {
        require(hasPendingTransfer[productId], "No pending transfer for this product");
        return pendingTransfers[productId];
    }

    function getPendingTransfersForUser(address user) external view returns (uint256[] memory) {
        uint256[] memory userPendingTransfers = new uint256[](nextProductId);
        uint256 count = 0;
        
        for (uint256 i = 0; i < nextProductId; i++) {
            if (hasPendingTransfer[i]) {
                PendingTransfer memory transfer = pendingTransfers[i];
                if (transfer.from == user || transfer.to == user) {
                    userPendingTransfers[count] = i;
                    count++;
                }
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userPendingTransfers[i];
        }
        
        return result;
    }

    function transferProduct(
        uint256 productId,
        address newOwner,
        Stage newStage,
        string calldata location
    ) external onlyProductOwner(productId) canTransfer {
        require(newOwner != address(0), "New owner is zero address");

        address previousOwner = products[productId].currentOwner;
        _removeOwnerProduct(previousOwner, productId);

        products[productId].currentOwner = newOwner;
        products[productId].currentStage = newStage;
        products[productId].timestamp = block.timestamp;
        ownerProducts[newOwner].push(productId);
        productHistory[productId].push(
            HistoryEntry({
                actor: msg.sender,
                stage: newStage,
                timestamp: block.timestamp,
                location: location
            })
        );

        emit ProductTransferred(productId, previousOwner, newOwner, newStage);
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        require(productExists[productId], "Product does not exist");
        return products[productId];
    }

    function getProductHistory(uint256 productId) external view returns (HistoryEntry[] memory) {
        require(productExists[productId], "Product does not exist");
        return productHistory[productId];
    }

    function getProductsByOwner(address owner) external view returns (uint256[] memory) {
        // Only return products owned by this address
        return ownerProducts[owner];
    }

    function getVisibleProducts(address user) external view returns (uint256[] memory) {
        uint256[] memory visibleProducts = new uint256[](nextProductId);
        uint256 count = 0;
        
        for (uint256 i = 0; i < nextProductId; i++) {
            if (productExists[i]) {
                // User can see products they own
                if (products[i].currentOwner == user) {
                    visibleProducts[count] = i;
                    count++;
                }
                // User can see products they're involved in pending transfers
                else if (hasPendingTransfer[i]) {
                    PendingTransfer memory transfer = pendingTransfers[i];
                    if (transfer.from == user || transfer.to == user) {
                        visibleProducts[count] = i;
                        count++;
                    }
                }
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = visibleProducts[i];
        }
        
        return result;
    }

    function getAllProductIds() external view returns (uint256[] memory) {
        uint256[] memory allIds = new uint256[](nextProductId);
        for (uint256 i = 0; i < nextProductId; i++) {
            if (productExists[i]) {
                allIds[i] = i;
            }
        }
        return allIds;
    }

    function getTotalProducts() external view returns (uint256) {
        return nextProductId;
    }

    function _removeOwnerProduct(address owner, uint256 productId) internal {
        uint256[] storage owned = ownerProducts[owner];
        uint256 length = owned.length;
        for (uint256 i = 0; i < length; i++) {
            if (owned[i] == productId) {
                owned[i] = owned[length - 1];
                owned.pop();
                break;
            }
        }
    }
}
