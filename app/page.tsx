"use client"

import { useEffect, useState } from "react"
import { Plus, TrendingUp, TrendingDown, Wallet, Users, Calendar, CreditCard, BarChart3, Target } from "lucide-react"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏸 Keuangan Eskul Badminton</h1>
          <p className="text-gray-600">Kelola keuangan dan anggota ekstrakurikuler dengan mudah</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(balance)}</div>
              <Badge variant={balance >= 0 ? "default" : "destructive"} className="mt-2">
                {balance >= 0 ? "Surplus" : "Defisit"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Anggota</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{paymentStats.totalMembers}</div>
              <p className="text-xs text-gray-500 mt-2">Anggota aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sudah Bayar Bulan Ini</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {paymentStats.paidThisMonth}/{paymentStats.totalMembers}
              </div>
              <p className="text-xs text-gray-500 mt-2">{formatCurrency(paymentStats.totalCollected)} terkumpul</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Belum Bayar</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{paymentStats.unpaidThisMonth}</div>
              <p className="text-xs text-gray-500 mt-2">Anggota belum bayar kas</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setIsDialogOpen(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Tambah Transaksi
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Anggota
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pembayaran Kas
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Transaksi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Pemasukan vs Pengeluaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Pemasukan</span>
                      <span className="font-bold text-green-600">{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Pengeluaran</span>
                      <span className="font-bold text-red-600">{formatCurrency(totalExpense)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Saldo Akhir</span>
                      <span className={`font-bold text-lg ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Status Pembayaran Kas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sudah Bayar</span>
                      <Badge variant="default">{paymentStats.paidThisMonth} anggota</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Belum Bayar</span>
                      <Badge variant="destructive">{paymentStats.unpaidThisMonth} anggota</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${paymentStats.totalMembers > 0 ? (paymentStats.paidThisMonth / paymentStats.totalMembers) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {paymentStats.totalMembers > 0
                        ? Math.round((paymentStats.paidThisMonth / paymentStats.totalMembers) * 100)
                        : 0}
                      % sudah membayar kas bulan ini
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Transaksi Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionList transactions={transactions.slice(0, 5)} formatCurrency={formatCurrency} />
              </CardContent>
            </Card>
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
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Semua Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionList transactions={transactions} formatCurrency={formatCurrency} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Transaction Dialog */}
        <AddTransactionDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onTransactionAdded={handleTransactionAdded}
          members={members}
        />
      </div>
    </div>
  )
}
