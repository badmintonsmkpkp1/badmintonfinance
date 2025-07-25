"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, Target, Calendar, PieChartIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AnalyticsData {
  monthlyData: Array<{
    month: string
    income: number
    expense: number
    net: number
  }>
  categoryData: Array<{
    category: string
    amount: number
    percentage: number
  }>
  classPaymentStats: Array<{
    class: string
    paid: number
    total: number
    percentage: number
  }>
  budgetComparison: Array<{
    category: string
    budget: number
    actual: number
    remaining: number
    percentage: number
  }>
}

interface AnalyticsDashboardProps {
  formatCurrency: (amount: number) => string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function AnalyticsDashboard({ formatCurrency }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    monthlyData: [],
    categoryData: [],
    classPaymentStats: [],
    budgetComparison: [],
  })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Fetch monthly income/expense data
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .gte("date", `${selectedYear}-01-01`)
        .lte("date", `${selectedYear}-12-31`)

      // Fetch budget data
      const { data: budgets } = await supabase.from("budgets").select("*").eq("year", selectedYear)

      // Fetch members and payments for class stats
      const { data: members } = await supabase
        .from("members")
        .select(`
          *,
          member_payments!inner(*)
        `)
        .eq("status", "active")

      // Process monthly data
      const monthlyStats = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        const monthName = new Date(selectedYear, i).toLocaleDateString("id-ID", { month: "short" })

        const monthTransactions =
          transactions?.filter((t) => {
            const transactionMonth = new Date(t.date).getMonth() + 1
            return transactionMonth === month
          }) || []

        const income = monthTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const expense = monthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0)

        return {
          month: monthName,
          income,
          expense,
          net: income - expense,
        }
      })

      // Process category data
      const categoryStats =
        transactions?.reduce(
          (acc, transaction) => {
            const category = transaction.category || "lainnya"
            if (transaction.type === "expense") {
              acc[category] = (acc[category] || 0) + Number(transaction.amount)
            }
            return acc
          },
          {} as Record<string, number>,
        ) || {}

      const totalExpense = Object.values(categoryStats).reduce((sum, amount) => sum + amount, 0)
      const categoryData = Object.entries(categoryStats).map(([category, amount]) => ({
        category: category.replace("-", " ").toUpperCase(),
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))

      // Process class payment stats
      const classStats =
        members?.reduce(
          (acc, member) => {
            const className = member.class
            if (!acc[className]) {
              acc[className] = { paid: 0, total: 0 }
            }
            acc[className].total += 1
            if (member.member_payments?.length > 0) {
              acc[className].paid += 1
            }
            return acc
          },
          {} as Record<string, { paid: number; total: number }>,
        ) || {}

      const classPaymentStats = Object.entries(classStats).map(([className, stats]) => ({
        class: className,
        paid: stats.paid,
        total: stats.total,
        percentage: stats.total > 0 ? (stats.paid / stats.total) * 100 : 0,
      }))

      // Process budget comparison
      const currentMonth = new Date().getMonth() + 1
      const budgetComparison =
        budgets?.map((budget) => {
          const actualSpent =
            transactions
              ?.filter(
                (t) =>
                  t.type === "expense" &&
                  t.category === budget.category &&
                  new Date(t.date).getMonth() + 1 === budget.month,
              )
              .reduce((sum, t) => sum + Number(t.amount), 0) || 0

          return {
            category: budget.category.replace("-", " ").toUpperCase(),
            budget: Number(budget.monthly_limit),
            actual: actualSpent,
            remaining: Number(budget.monthly_limit) - actualSpent,
            percentage: Number(budget.monthly_limit) > 0 ? (actualSpent / Number(budget.monthly_limit)) * 100 : 0,
          }
        }) || []

      setAnalyticsData({
        monthlyData: monthlyStats,
        categoryData,
        classPaymentStats,
        budgetComparison,
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedYear])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h2>
          <p className="text-gray-600">Analisis mendalam keuangan ekstrakurikuler</p>
        </div>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Trend Pemasukan vs Pengeluaran {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              income: {
                label: "Pemasukan",
                color: "hsl(var(--chart-1))",
              },
              expense: {
                label: "Pengeluaran",
                color: "hsl(var(--chart-2))",
              },
              net: {
                label: "Net",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="income" fill="var(--color-income)" name="Pemasukan" />
                <Bar dataKey="expense" fill="var(--color-expense)" name="Pengeluaran" />
                <Line dataKey="net" stroke="var(--color-net)" name="Net" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-600" />
              Breakdown Pengeluaran per Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: {
                  label: "Amount",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {analyticsData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Budget vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Budget vs Pengeluaran Aktual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.budgetComparison.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.category}</span>
                    <Badge
                      variant={item.percentage > 100 ? "destructive" : item.percentage > 80 ? "secondary" : "default"}
                    >
                      {item.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.percentage > 100 ? "bg-red-500" : item.percentage > 80 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Actual: {formatCurrency(item.actual)}</span>
                    <span>Budget: {formatCurrency(item.budget)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Payment Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Statistik Pembayaran Kas per Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsData.classPaymentStats.map((classData, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{classData.class}</h3>
                  <Badge variant={classData.percentage === 100 ? "default" : "secondary"}>
                    {classData.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {classData.paid} dari {classData.total} sudah bayar
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${classData.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
