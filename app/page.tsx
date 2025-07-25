"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Target,
  FileText,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { TransactionList } from "@/components/transaction-list"
import { MembersManagement } from "@/components/members-management"
import { PaymentTracking } from "@/components/payment-tracking"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { BudgetManagement } from "@/components/budget-management"
import { PdfReportGenerator } from "@/components/pdf-report-generator"
import { ReminderSystem } from "@/components/reminder-system"
import { QuickActions } from "@/components/quick-actions"
import { ModeToggle } from "@/components/mode-toggle"
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

interface Member {
  id: string
  name: string
  class: string
  phone: string
  status: string
}

interface PaymentStats {
  totalMembers: number
  paidThisMonth: number
  unpaidThisMonth: number
  totalCollected: number
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalMembers: 0,
    paidThisMonth: 0,
    unpaidThisMonth: 0,
    totalCollected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false })
      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from("members").select("*").order("name")
      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const fetchPaymentStats = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      // Get total active members
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("id")
        .eq("status", "active")

      if (membersError) throw membersError

      // Get payments for current month
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("member_payments")
        .select("member_id, amount")
        .eq("month", currentMonth)
        .eq("year", currentYear)

      if (paymentsError) throw paymentsError

      // Get total collected this month
      const totalCollected = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

      const totalMembers = membersData?.length || 0
      const paidThisMonth = paymentsData?.length || 0
      const unpaidThisMonth = totalMembers - paidThisMonth

      setPaymentStats({
        totalMembers,
        paidThisMonth,
        unpaidThisMonth,
        totalCollected,
      })
    } catch (error) {
      console.error("Error fetching payment stats:", error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchTransactions(), fetchMembers(), fetchPaymentStats()])
      setLoading(false)
    }
    fetchData()
  }, [])

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleTransactionAdded = () => {
    fetchTransactions()
    fetchPaymentStats()
    setIsDialogOpen(false)
  }

  const handleDataUpdated = () => {
    fetchMembers()
    fetchPaymentStats()
    fetchTransactions()
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute right-0 top-0">
            <ModeToggle />
          </div>
          <motion.h1
            className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            🏸 Keuangan Eskul Badminton
          </motion.h1>
          <motion.p
            className="text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Kelola keuangan dan anggota ekstrakurikuler dengan mudah
          </motion.p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Saldo</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(balance)}</div>
                <Badge variant={balance >= 0 ? "default" : "destructive"} className="mt-2">
                  {balance >= 0 ? "Surplus" : "Defisit"}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Anggota</CardTitle>
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {paymentStats.totalMembers}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Anggota aktif</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Sudah Bayar Bulan Ini
                </CardTitle>
                <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {paymentStats.paidThisMonth}/{paymentStats.totalMembers}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formatCurrency(paymentStats.totalCollected)} terkumpul
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Belum Bayar</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{paymentStats.unpaidThisMonth}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Anggota belum bayar kas</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-8 py-3 rounded-full shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Tambah Transaksi
            </Button>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 bg-white dark:bg-gray-800 shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Anggota</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Pembayaran</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Transaksi</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Laporan</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Reminder</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Pemasukan vs Pengeluaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Total Pemasukan</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(totalIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Total Pengeluaran</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense)}</span>
                      </div>
                      <hr className="dark:border-gray-700" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Saldo Akhir</span>
                        <span
                          className={`font-bold text-lg ${balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Status Pembayaran Kas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Sudah Bayar</span>
                        <Badge variant="default">{paymentStats.paidThisMonth} anggota</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Belum Bayar</span>
                        <Badge variant="destructive">{paymentStats.unpaidThisMonth} anggota</Badge>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${paymentStats.totalMembers > 0 ? (paymentStats.paidThisMonth / paymentStats.totalMembers) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {paymentStats.totalMembers > 0
                          ? Math.round((paymentStats.paidThisMonth / paymentStats.totalMembers) * 100)
                          : 0}
                        % sudah membayar kas bulan ini
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Transaksi Terbaru
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionList transactions={transactions.slice(0, 5)} formatCurrency={formatCurrency} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetManagement formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="members">
            <MembersManagement members={members} onDataUpdated={handleDataUpdated} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentTracking members={members} formatCurrency={formatCurrency} onDataUpdated={handleDataUpdated} />
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Semua Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionList transactions={transactions} formatCurrency={formatCurrency} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <PdfReportGenerator formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="reminders">
            <ReminderSystem />
          </TabsContent>
        </Tabs>

        {/* Add Transaction Dialog */}
        <AddTransactionDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onTransactionAdded={handleTransactionAdded}
          members={members}
        />

        {/* Quick Actions Floating Button */}
        <QuickActions onAddTransaction={() => setIsDialogOpen(true)} onTabChange={handleTabChange} />
      </div>
    </div>
  )
}
