// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TeleportLedger
 * @dev Smart contract for tamper-proof package custody tracking
 */
contract TeleportLedger is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _packageIds;
    
    // Package status enum
    enum PackageStatus { Created, PickedUp, InTransit, Delivered, Cancelled }
    
    // Transfer type enum
    enum TransferType { Pickup, Handoff, Delivery }
    
    // Package struct
    struct Package {
        uint256 id;
        string trackingNumber;
        address sender;
        address recipient;
        string title;
        string description;
        uint256 value; // in wei
        PackageStatus status;
        string ipfsHash; // IPFS hash for package metadata
        uint256 createdAt;
        uint256 deliveredAt;
        bool exists;
    }
    
    // Custody transfer struct
    struct CustodyTransfer {
        uint256 packageId;
        address fromCustodian;
        address toCustodian;
        TransferType transferType;
        string location; // GPS coordinates or address
        string photoHash; // IPFS hash for transfer photo
        string signatureHash; // IPFS hash for digital signature
        uint256 timestamp;
        bool verified;
    }
    
    // Mappings
    mapping(uint256 => Package) public packages;
    mapping(string => uint256) public trackingToPackageId;
    mapping(uint256 => CustodyTransfer[]) public packageTransfers;
    mapping(address => uint256[]) public userPackages;
    mapping(address => bool) public authorizedCouriers;
    
    // Events
    event PackageCreated(
        uint256 indexed packageId,
        string trackingNumber,
        address indexed sender,
        address indexed recipient
    );
    
    event CustodyTransferred(
        uint256 indexed packageId,
        address indexed fromCustodian,
        address indexed toCustodian,
        TransferType transferType,
        uint256 timestamp
    );
    
    event PackageStatusUpdated(
        uint256 indexed packageId,
        PackageStatus newStatus,
        uint256 timestamp
    );
    
    event CourierAuthorized(address indexed courier, bool authorized);
    
    event PackageDelivered(
        uint256 indexed packageId,
        address indexed recipient,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyPackageParticipant(uint256 packageId) {
        Package memory pkg = packages[packageId];
        require(pkg.exists, "Package does not exist");
        require(
            msg.sender == pkg.sender || 
            msg.sender == pkg.recipient || 
            authorizedCouriers[msg.sender] ||
            msg.sender == owner(),
            "Not authorized for this package"
        );
        _;
    }
    
    modifier onlyAuthorizedCourier() {
        require(
            authorizedCouriers[msg.sender] || msg.sender == owner(),
            "Not an authorized courier"
        );
        _;
    }
    
    modifier packageExists(uint256 packageId) {
        require(packages[packageId].exists, "Package does not exist");
        _;
    }
    
    constructor() {}
    
    /**
     * @dev Create a new package
     */
    function createPackage(
        string memory trackingNumber,
        address recipient,
        string memory title,
        string memory description,
        uint256 value,
        string memory ipfsHash
    ) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient address");
        require(recipient != msg.sender, "Cannot send to yourself");
        require(bytes(trackingNumber).length > 0, "Tracking number required");
        require(trackingToPackageId[trackingNumber] == 0, "Tracking number already exists");
        
        _packageIds.increment();
        uint256 packageId = _packageIds.current();
        
        packages[packageId] = Package({
            id: packageId,
            trackingNumber: trackingNumber,
            sender: msg.sender,
            recipient: recipient,
            title: title,
            description: description,
            value: value,
            status: PackageStatus.Created,
            ipfsHash: ipfsHash,
            createdAt: block.timestamp,
            deliveredAt: 0,
            exists: true
        });
        
        trackingToPackageId[trackingNumber] = packageId;
        userPackages[msg.sender].push(packageId);
        userPackages[recipient].push(packageId);
        
        emit PackageCreated(packageId, trackingNumber, msg.sender, recipient);
        
        return packageId;
    }
    
    /**
     * @dev Transfer custody of a package
     */
    function transferCustody(
        uint256 packageId,
        address toCustodian,
        TransferType transferType,
        string memory location,
        string memory photoHash,
        string memory signatureHash
    ) external onlyPackageParticipant(packageId) nonReentrant {
        require(toCustodian != address(0), "Invalid custodian address");
        require(toCustodian != msg.sender, "Cannot transfer to yourself");
        
        Package storage pkg = packages[packageId];
        require(pkg.status != PackageStatus.Delivered, "Package already delivered");
        require(pkg.status != PackageStatus.Cancelled, "Package cancelled");
        
        // Create custody transfer record
        CustodyTransfer memory transfer = CustodyTransfer({
            packageId: packageId,
            fromCustodian: msg.sender,
            toCustodian: toCustodian,
            transferType: transferType,
            location: location,
            photoHash: photoHash,
            signatureHash: signatureHash,
            timestamp: block.timestamp,
            verified: false
        });
        
        packageTransfers[packageId].push(transfer);
        
        // Update package status based on transfer type
        if (transferType == TransferType.Pickup && pkg.status == PackageStatus.Created) {
            pkg.status = PackageStatus.PickedUp;
        } else if (transferType == TransferType.Handoff) {
            pkg.status = PackageStatus.InTransit;
        } else if (transferType == TransferType.Delivery) {
            pkg.status = PackageStatus.Delivered;
            pkg.deliveredAt = block.timestamp;
            emit PackageDelivered(packageId, pkg.recipient, block.timestamp);
        }
        
        // Add package to new custodian's list if not already there
        bool alreadyInList = false;
        uint256[] memory userPkgs = userPackages[toCustodian];
        for (uint256 i = 0; i < userPkgs.length; i++) {
            if (userPkgs[i] == packageId) {
                alreadyInList = true;
                break;
            }
        }
        if (!alreadyInList) {
            userPackages[toCustodian].push(packageId);
        }
        
        emit CustodyTransferred(packageId, msg.sender, toCustodian, transferType, block.timestamp);
        emit PackageStatusUpdated(packageId, pkg.status, block.timestamp);
    }
    
    /**
     * @dev Verify a custody transfer (for AI verification integration)
     */
    function verifyCustodyTransfer(
        uint256 packageId,
        uint256 transferIndex,
        bool verified
    ) external onlyAuthorizedCourier {
        require(transferIndex < packageTransfers[packageId].length, "Invalid transfer index");
        
        packageTransfers[packageId][transferIndex].verified = verified;
    }
    
    /**
     * @dev Update package status
     */
    function updatePackageStatus(
        uint256 packageId,
        PackageStatus newStatus
    ) external onlyPackageParticipant(packageId) {
        Package storage pkg = packages[packageId];
        require(pkg.status != PackageStatus.Delivered, "Package already delivered");
        
        pkg.status = newStatus;
        
        if (newStatus == PackageStatus.Delivered) {
            pkg.deliveredAt = block.timestamp;
            emit PackageDelivered(packageId, pkg.recipient, block.timestamp);
        }
        
        emit PackageStatusUpdated(packageId, newStatus, block.timestamp);
    }
    
    /**
     * @dev Authorize or deauthorize a courier
     */
    function setCourierAuthorization(address courier, bool authorized) external onlyOwner {
        require(courier != address(0), "Invalid courier address");
        authorizedCouriers[courier] = authorized;
        emit CourierAuthorized(courier, authorized);
    }
    
    /**
     * @dev Get package details
     */
    function getPackage(uint256 packageId) external view packageExists(packageId) returns (Package memory) {
        return packages[packageId];
    }
    
    /**
     * @dev Get package by tracking number
     */
    function getPackageByTracking(string memory trackingNumber) external view returns (Package memory) {
        uint256 packageId = trackingToPackageId[trackingNumber];
        require(packageId != 0, "Package not found");
        return packages[packageId];
    }
    
    /**
     * @dev Get all custody transfers for a package
     */
    function getPackageTransfers(uint256 packageId) external view packageExists(packageId) returns (CustodyTransfer[] memory) {
        return packageTransfers[packageId];
    }
    
    /**
     * @dev Get packages for a user
     */
    function getUserPackages(address user) external view returns (uint256[] memory) {
        return userPackages[user];
    }
    
    /**
     * @dev Get total number of packages
     */
    function getTotalPackages() external view returns (uint256) {
        return _packageIds.current();
    }
    
    /**
     * @dev Emergency function to cancel a package
     */
    function cancelPackage(uint256 packageId) external onlyPackageParticipant(packageId) {
        Package storage pkg = packages[packageId];
        require(pkg.status != PackageStatus.Delivered, "Cannot cancel delivered package");
        
        pkg.status = PackageStatus.Cancelled;
        emit PackageStatusUpdated(packageId, PackageStatus.Cancelled, block.timestamp);
    }
    
    /**
     * @dev Get package custody chain (all transfers)
     */
    function getCustodyChain(uint256 packageId) external view packageExists(packageId) returns (
        address[] memory custodians,
        uint256[] memory timestamps,
        TransferType[] memory transferTypes,
        bool[] memory verifications
    ) {
        CustodyTransfer[] memory transfers = packageTransfers[packageId];
        uint256 length = transfers.length;
        
        custodians = new address[](length + 1);
        timestamps = new uint256[](length + 1);
        transferTypes = new TransferType[](length + 1);
        verifications = new bool[](length + 1);
        
        // First entry is the sender
        Package memory pkg = packages[packageId];
        custodians[0] = pkg.sender;
        timestamps[0] = pkg.createdAt;
        transferTypes[0] = TransferType.Pickup; // Default for creation
        verifications[0] = true; // Package creation is always verified
        
        // Add all transfers
        for (uint256 i = 0; i < length; i++) {
            custodians[i + 1] = transfers[i].toCustodian;
            timestamps[i + 1] = transfers[i].timestamp;
            transferTypes[i + 1] = transfers[i].transferType;
            verifications[i + 1] = transfers[i].verified;
        }
    }
}
