"use client"

import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"

interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  date: string
  created_at: string
  category?: string
}

interface TransactionListProps {
  transactions: Transaction[]
  formatCurrency: (amount: number) => string
}

export function TransactionList({ transactions, formatCurrency }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 dark:text-gray-600 mb-2">📊</div>
        <p className="text-gray-500 dark:text-gray-400">Belum ada transaksi</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Tambahkan transaksi pertama Anda</p>
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

  const getCategoryLabel = (category?: string) => {
    if (!category) return "Lainnya"

    const categories: Record<string, string> = {
      "kas-anggota": "Kas Anggota",
      peralatan: "Peralatan",
      "sewa-lapangan": "Sewa Lapangan",
      konsumsi: "Konsumsi",
      transport: "Transport",
      turnamen: "Turnamen",
      lainnya: "Lainnya",
    }

    return categories[category] || category.replace("-", " ").toUpperCase()
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
      {transactions.map((transaction) => (
        <motion.div
          key={transaction.id}
          variants={item}
          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                transaction.type === "income"
                  ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {transaction.type === "income" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">{transaction.description}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                {transaction.category && (
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(transaction.category)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`font-bold ${transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </p>
            <Badge variant={transaction.type === "income" ? "default" : "secondary"} className="text-xs">
              {transaction.type === "income" ? "Masuk" : "Keluar"}
            </Badge>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
