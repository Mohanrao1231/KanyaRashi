// Web3 contract interaction utilities
import { ethers } from "ethers"

// Contract ABI (Application Binary Interface)
export const TELEPORT_LEDGER_ABI = [
  // Events
  "event PackageCreated(uint256 indexed packageId, string trackingNumber, address indexed sender, address indexed recipient)",
  "event CustodyTransferred(uint256 indexed packageId, address indexed fromCustodian, address indexed toCustodian, uint8 transferType, uint256 timestamp)",
  "event PackageStatusUpdated(uint256 indexed packageId, uint8 newStatus, uint256 timestamp)",
  "event PackageDelivered(uint256 indexed packageId, address indexed recipient, uint256 timestamp)",

  // Read functions
  "function getPackage(uint256 packageId) view returns (tuple(uint256 id, string trackingNumber, address sender, address recipient, string title, string description, uint256 value, uint8 status, string ipfsHash, uint256 createdAt, uint256 deliveredAt, bool exists))",
  "function getPackageByTracking(string trackingNumber) view returns (tuple(uint256 id, string trackingNumber, address sender, address recipient, string title, string description, uint256 value, uint8 status, string ipfsHash, uint256 createdAt, uint256 deliveredAt, bool exists))",
  "function getPackageTransfers(uint256 packageId) view returns (tuple(uint256 packageId, address fromCustodian, address toCustodian, uint8 transferType, string location, string photoHash, string signatureHash, uint256 timestamp, bool verified)[])",
  "function getUserPackages(address user) view returns (uint256[])",
  "function getCustodyChain(uint256 packageId) view returns (address[] custodians, uint256[] timestamps, uint8[] transferTypes, bool[] verifications)",
  "function getTotalPackages() view returns (uint256)",
  "function authorizedCouriers(address) view returns (bool)",

  // Write functions
  "function createPackage(string trackingNumber, address recipient, string title, string description, uint256 value, string ipfsHash) returns (uint256)",
  "function transferCustody(uint256 packageId, address toCustodian, uint8 transferType, string location, string photoHash, string signatureHash)",
  "function updatePackageStatus(uint256 packageId, uint8 newStatus)",
  "function cancelPackage(uint256 packageId)",
  "function verifyCustodyTransfer(uint256 packageId, uint256 transferIndex, bool verified)",

  // Owner functions
  "function setCourierAuthorization(address courier, bool authorized)",
]

// Contract address (will be set after deployment)
export const TELEPORT_LEDGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

// Package status enum
export const PackageStatus = {
  CREATED: 0,
  PICKED_UP: 1,
  IN_TRANSIT: 2,
  DELIVERED: 3,
  CANCELLED: 4,
}

// Transfer type enum
export const TransferType = {
  PICKUP: 0,
  HANDOFF: 1,
  DELIVERY: 2,
}

// Get contract instance
export function getTeleportLedgerContract(signerOrProvider) {
  if (!TELEPORT_LEDGER_ADDRESS) {
    throw new Error("Contract address not configured")
  }

  return new ethers.Contract(TELEPORT_LEDGER_ADDRESS, TELEPORT_LEDGER_ABI, signerOrProvider)
}

// Helper function to get provider
export function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum)
  }

  // Fallback to Polygon RPC
  return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_POLYGON_RPC_URL || "https://polygon-rpc.com")
}

// Helper function to get signer
export async function getSigner() {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", [])
    return provider.getSigner()
  }

  throw new Error("No wallet connected")
}

// Contract interaction functions
export const contractService = {
  // Create a new package
  async createPackage(packageData) {
    const signer = await getSigner()
    const contract = getTeleportLedgerContract(signer)

    const tx = await contract.createPackage(
      packageData.trackingNumber,
      packageData.recipient,
      packageData.title,
      packageData.description,
      ethers.utils.parseEther(packageData.value.toString()),
      packageData.ipfsHash,
    )

    return await tx.wait()
  },

  // Transfer custody
  async transferCustody(transferData) {
    const signer = await getSigner()
    const contract = getTeleportLedgerContract(signer)

    const tx = await contract.transferCustody(
      transferData.packageId,
      transferData.toCustodian,
      transferData.transferType,
      transferData.location,
      transferData.photoHash,
      transferData.signatureHash,
    )

    return await tx.wait()
  },

  // Get package details
  async getPackage(packageId) {
    const provider = getProvider()
    const contract = getTeleportLedgerContract(provider)

    return await contract.getPackage(packageId)
  },

  // Get package by tracking number
  async getPackageByTracking(trackingNumber) {
    const provider = getProvider()
    const contract = getTeleportLedgerContract(provider)

    return await contract.getPackageByTracking(trackingNumber)
  },

  // Get user packages
  async getUserPackages(userAddress) {
    const provider = getProvider()
    const contract = getTeleportLedgerContract(provider)

    return await contract.getUserPackages(userAddress)
  },

  // Get custody chain
  async getCustodyChain(packageId) {
    const provider = getProvider()
    const contract = getTeleportLedgerContract(provider)

    return await contract.getCustodyChain(packageId)
  },

  // Update package status
  async updatePackageStatus(packageId, newStatus) {
    const signer = await getSigner()
    const contract = getTeleportLedgerContract(signer)

    const tx = await contract.updatePackageStatus(packageId, newStatus)
    return await tx.wait()
  },
}
