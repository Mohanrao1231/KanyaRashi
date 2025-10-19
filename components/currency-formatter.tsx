interface CurrencyFormatterProps {
  amount: number | string
  className?: string
}

export function CurrencyFormatter({ amount, className = "" }: CurrencyFormatterProps) {
  const formatINR = (value: number | string) => {
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    if (isNaN(numValue)) return "₹0.00"

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue)
  }

  return <span className={className}>{formatINR(amount)}</span>
}

export function formatINRCurrency(amount: number | string): string {
  const numValue = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (isNaN(numValue)) return "₹0.00"

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}
