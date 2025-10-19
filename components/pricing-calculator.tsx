"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calculator, IndianRupee } from "lucide-react"
import { CurrencyFormatter } from "./currency-formatter"

interface PricingResult {
  baseCost: number
  weightCost: number
  distanceCost: number
  priorityCost: number
  fragileCost: number
  insuranceCost: number
  totalCost: number
  currency: string
  distance: number
}

export function PricingCalculator() {
  const [weight, setWeight] = useState("")
  const [priority, setPriority] = useState("standard")
  const [fragile, setFragile] = useState(false)
  const [declaredValue, setDeclaredValue] = useState("")
  const [pricing, setPricing] = useState<PricingResult | null>(null)
  const [loading, setLoading] = useState(false)

  const calculatePricing = async () => {
    if (!weight) return

    setLoading(true)
    try {
      const response = await fetch("/api/packages/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weight: Number.parseFloat(weight),
          priority,
          fragile,
          declaredValue: Number.parseFloat(declaredValue) || 0,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPricing(data.pricing)
      }
    } catch (error) {
      console.error("Failed to calculate pricing:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Pricing Calculator
        </CardTitle>
        <CardDescription className="text-slate-400">Calculate shipping costs for your package</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight" className="text-slate-300">
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Enter weight"
            />
          </div>

          <div>
            <Label htmlFor="priority" className="text-slate-300">
              Priority
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="express">Express (+50%)</SelectItem>
                <SelectItem value="overnight">Overnight (+150%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="declaredValue" className="text-slate-300">
              Declared Value (₹)
            </Label>
            <Input
              id="declaredValue"
              type="number"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Enter value"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="fragile" checked={fragile} onCheckedChange={setFragile} />
            <Label htmlFor="fragile" className="text-slate-300">
              Fragile Item (+20%)
            </Label>
          </div>
        </div>

        <Button
          onClick={calculatePricing}
          disabled={!weight || loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Calculating..." : "Calculate Pricing"}
        </Button>

        {pricing && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Pricing Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Base Cost:</span>
                <CurrencyFormatter amount={pricing.baseCost} className="text-white" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Weight Cost:</span>
                <CurrencyFormatter amount={pricing.weightCost} className="text-white" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance Cost ({pricing.distance}km):</span>
                <CurrencyFormatter amount={pricing.distanceCost} className="text-white" />
              </div>
              {pricing.priorityCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Priority Surcharge:</span>
                  <CurrencyFormatter amount={pricing.priorityCost} className="text-white" />
                </div>
              )}
              {pricing.fragileCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Fragile Handling:</span>
                  <CurrencyFormatter amount={pricing.fragileCost} className="text-white" />
                </div>
              )}
              {pricing.insuranceCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Insurance (2%):</span>
                  <CurrencyFormatter amount={pricing.insuranceCost} className="text-white" />
                </div>
              )}
              <div className="border-t border-slate-700 pt-2 mt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-white">Total Cost:</span>
                  <CurrencyFormatter amount={pricing.totalCost} className="text-green-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
