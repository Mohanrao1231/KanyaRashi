"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, ExternalLink, AlertCircle } from "lucide-react"

interface Web3WalletProps {
  onWalletConnected: (address: string, chainId: number) => void
  onWalletDisconnected: () => void
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export function Web3Wallet({ onWalletConnected, onWalletDisconnected }: Web3WalletProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string>("")
  const [chainId, setChainId] = useState<number>(0)
  const [balance, setBalance] = useState<string>("0")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const POLYGON_CHAIN_ID = 137
  const MUMBAI_CHAIN_ID = 80001

  useEffect(() => {
    checkConnection()
    setupEventListeners()
  }, [])

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          setAddress(accounts[0])
          setChainId(Number.parseInt(chainId, 16))
          setIsConnected(true)
          await getBalance(accounts[0])
          onWalletConnected(accounts[0], Number.parseInt(chainId, 16))
        }
      } catch (err) {
        console.error("Error checking connection:", err)
      }
    }
  }

  const setupEventListeners = () => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      setAddress(accounts[0])
      getBalance(accounts[0])
      onWalletConnected(accounts[0], chainId)
    }
  }

  const handleChainChanged = (chainId: string) => {
    const newChainId = Number.parseInt(chainId, 16)
    setChainId(newChainId)
    if (isConnected) {
      onWalletConnected(address, newChainId)
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask is not installed. Please install MetaMask to continue.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      const newChainId = Number.parseInt(chainId, 16)

      setAddress(accounts[0])
      setChainId(newChainId)
      setIsConnected(true)

      await getBalance(accounts[0])
      onWalletConnected(accounts[0], newChainId)
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress("")
    setChainId(0)
    setBalance("0")
    onWalletDisconnected()
  }

  const getBalance = async (address: string) => {
    try {
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })
      const balanceInEth = (Number.parseInt(balance, 16) / 1e18).toFixed(4)
      setBalance(balanceInEth)
    } catch (err) {
      console.error("Error getting balance:", err)
    }
  }

  const switchToPolygon = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${POLYGON_CHAIN_ID.toString(16)}` }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${POLYGON_CHAIN_ID.toString(16)}`,
                chainName: "Polygon Mainnet",
                nativeCurrency: {
                  name: "MATIC",
                  symbol: "MATIC",
                  decimals: 18,
                },
                rpcUrls: ["https://polygon-rpc.com/"],
                blockExplorerUrls: ["https://polygonscan.com/"],
              },
            ],
          })
        } catch (addError) {
          setError("Failed to add Polygon network")
        }
      }
    }
  }

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum"
      case 137:
        return "Polygon"
      case 80001:
        return "Mumbai Testnet"
      default:
        return `Chain ${chainId}`
    }
  }

  const isCorrectChain = chainId === POLYGON_CHAIN_ID || chainId === MUMBAI_CHAIN_ID

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Web3 Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {!isConnected ? (
          <Button onClick={connectWallet} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Address:</span>
                <code className="text-sm font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Network:</span>
                <Badge variant={isCorrectChain ? "default" : "destructive"}>{getChainName(chainId)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Balance:</span>
                <span className="text-sm font-mono">{balance} MATIC</span>
              </div>
            </div>

            {!isCorrectChain && (
              <Button onClick={switchToPolygon} variant="outline" className="w-full bg-transparent">
                Switch to Polygon
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://polygonscan.com/address/${address}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
              <Button variant="destructive" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
