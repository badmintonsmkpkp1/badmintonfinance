"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, TrendingUp, Users, CreditCard, FileText, Bell, Target, BarChart3 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

interface QuickActionsProps {
  onAddTransaction: () => void
  onTabChange: (tab: string) => void
}

export function QuickActions({ onAddTransaction, onTabChange }: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  const actions = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: "Tambah Transaksi",
      action: () => onAddTransaction(),
      color: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Lihat Transaksi",
      action: () => onTabChange("transactions"),
      color: "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Kelola Anggota",
      action: () => onTabChange("members"),
      color: "bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white",
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      label: "Pembayaran Kas",
      action: () => onTabChange("payments"),
      color: "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white",
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Analytics",
      action: () => onTabChange("analytics"),
      color: "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white",
    },
    {
      icon: <Target className="h-4 w-4" />,
      label: "Budget",
      action: () => onTabChange("budget"),
      color: "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white",
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Laporan",
      action: () => onTabChange("reports"),
      color: "bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800 text-white",
    },
    {
      icon: <Bell className="h-4 w-4" />,
      label: "Reminder",
      action: () => onTabChange("reminders"),
      color: "bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <Card className="p-4 shadow-lg">
              <CardContent className="p-0 grid grid-cols-2 gap-2">
                {actions.map((action, index) => (
                  <motion.div key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      className={`w-full ${action.color}`}
                      size="sm"
                      onClick={() => {
                        action.action()
                        setIsExpanded(false)
                      }}
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          size="lg"
          className={`rounded-full shadow-lg ${
            isExpanded
              ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "×" : "+"}
        </Button>
      </motion.div>
    </motion.div>
  )
}
