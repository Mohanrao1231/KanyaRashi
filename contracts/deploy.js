// Deployment script for TeleportLedger contract
import { ethers, network } from "hardhat";
import * as hre from "hardhat";

async function main() {
  console.log("Deploying TeleportLedger contract...")

  // Get the contract factory
  const TeleportLedger = await ethers.getContractFactory("TeleportLedger")

  // Deploy the contract
  const teleportLedger = await TeleportLedger.deploy()

  // Wait for deployment to complete
  await teleportLedger.deployed()

  console.log("TeleportLedger deployed to:", teleportLedger.address)
  console.log("Transaction hash:", teleportLedger.deployTransaction.hash)

  // Verify the contract on Polygonscan (optional)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...")
    await teleportLedger.deployTransaction.wait(6)

    console.log("Verifying contract on Polygonscan...")
    try {
      await hre.run("verify:verify", {
        address: teleportLedger.address,
        constructorArguments: [],
      })
    } catch (error) {
      console.log("Verification failed:", error.message)
    }
  }

  return teleportLedger.address
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
