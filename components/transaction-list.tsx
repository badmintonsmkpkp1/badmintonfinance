"use client"

import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  date: string
  created_at: string
}

interface TransactionListProps {
  transactions: Transaction[]
  formatCurrency: (amount: number) => string
}

export function TransactionList({ transactions, formatCurrency }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">📊</div>
        <p className="text-gray-500">Belum ada transaksi</p>
        <p className="text-sm text-gray-400">Tambahkan transaksi pertama Anda</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                transaction.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              {transaction.type === "income" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{transaction.description}</p>
              <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </p>
            <Badge variant={transaction.type === "income" ? "default" : "secondary"} className="text-xs">
              {transaction.type === "income" ? "Masuk" : "Keluar"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
