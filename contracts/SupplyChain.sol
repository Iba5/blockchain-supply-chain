// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SupplyChain {
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

    uint256 private nextProductId;
    mapping(uint256 => Product) private products;
    mapping(uint256 => HistoryEntry[]) private productHistory;
    mapping(address => uint256[]) private ownerProducts;
    mapping(uint256 => bool) private productExists;

    event ProductCreated(uint256 indexed id, string name, address indexed manufacturer);
    event ProductTransferred(uint256 indexed id, address indexed from, address indexed to, Stage newStage);

    modifier onlyProductOwner(uint256 productId) {
        require(productExists[productId], "Product does not exist");
        require(msg.sender == products[productId].currentOwner, "Caller is not product owner");
        _;
    }

    function createProduct(string calldata name, string calldata description) external returns (uint256) {
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

    function transferProduct(
        uint256 productId,
        address newOwner,
        Stage newStage,
        string calldata location
    ) external onlyProductOwner(productId) {
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
        return ownerProducts[owner];
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
