"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Target, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface Budget {
  id: string
  category: string
  monthly_limit: number
  year: number
  month: number
  description: string
  actual_spent?: number
  remaining?: number
  percentage?: number
}

interface BudgetManagementProps {
  formatCurrency: (amount: number) => string
}

const categories = [
  { value: "peralatan", label: "Peralatan" },
  { value: "sewa-lapangan", label: "Sewa Lapangan" },
  { value: "konsumsi", label: "Konsumsi" },
  { value: "transport", label: "Transport" },
  { value: "turnamen", label: "Turnamen" },
  { value: "lainnya", label: "Lainnya" },
]

const months = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
]

export function BudgetManagement({ formatCurrency }: BudgetManagementProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({
    category: "",
    monthly_limit: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    description: "",
  })

  const fetchBudgets = async () => {
    try {
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("year", selectedYear)
        .eq("month", selectedMonth)
        .order("category")

      if (budgetError) throw budgetError

      // Fetch actual spending for each budget
      const budgetsWithActual = await Promise.all(
        (budgetData || []).map(async (budget) => {
          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("type", "expense")
            .eq("category", budget.category)
            .gte("date", `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-01`)
            .lt("date", `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-01`)

          const actualSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
          const remaining = Number(budget.monthly_limit) - actualSpent
          const percentage = Number(budget.monthly_limit) > 0 ? (actualSpent / Number(budget.monthly_limit)) * 100 : 0

          return {
            ...budget,
            actual_spent: actualSpent,
            remaining,
            percentage,
          }
        }),
      )

      setBudgets(budgetsWithActual)
    } catch (error) {
      console.error("Error fetching budgets:", error)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [selectedMonth, selectedYear])

  const resetForm = () => {
    setFormData({
      category: "",
      monthly_limit: "",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      description: "",
    })
    setEditingBudget(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (budget: Budget) => {
    setFormData({
      category: budget.category,
      monthly_limit: budget.monthly_limit.toString(),
      year: budget.year,
      month: budget.month,
      description: budget.description,
    })
    setEditingBudget(budget)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || !formData.monthly_limit) {
      toast({
        title: "Error",
        description: "Kategori dan limit budget harus diisi",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (editingBudget) {
        const { error } = await supabase
          .from("budgets")
          .update({
            category: formData.category,
            monthly_limit: Number.parseFloat(formData.monthly_limit),
            year: formData.year,
            month: formData.month,
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingBudget.id)

        if (error) throw error

        toast({
          title: "Berhasil!",
          description: "Budget berhasil diperbarui",
        })
      } else {
        const { error } = await supabase.from("budgets").insert([
          {
            category: formData.category,
            monthly_limit: Number.parseFloat(formData.monthly_limit),
            year: formData.year,
            month: formData.month,
            description: formData.description,
          },
        ])

        if (error) throw error

        toast({
          title: "Berhasil!",
          description: "Budget baru berhasil ditambahkan",
        })
      }

      resetForm()
      setIsDialogOpen(false)
      fetchBudgets()
    } catch (error) {
      console.error("Error saving budget:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan budget",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (budget: Budget) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus budget ${budget.category}?`)) {
      return
    }

    try {
      const { error } = await supabase.from("budgets").delete().eq("id", budget.id)

      if (error) throw error

      toast({
        title: "Berhasil!",
        description: "Budget berhasil dihapus",
      })

      fetchBudgets()
    } catch (error) {
      console.error("Error deleting budget:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus budget",
        variant: "destructive",
      })
    }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.actual_spent || 0), 0)
  const totalRemaining = totalBudget - totalSpent

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Planning & Tracking</h2>
          <p className="text-gray-600">Kelola dan pantau budget bulanan</p>
        </div>
        <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Budget
        </Button>
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>Periode:</Label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Sudah Terpakai</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Sisa Budget</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRemaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Detail Budget {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada budget untuk periode ini</p>
              <p className="text-sm text-gray-400">Tambahkan budget pertama Anda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => (
                <div key={budget.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {categories.find((c) => c.value === budget.category)?.label || budget.category}
                      </h3>
                      <p className="text-sm text-gray-500">{budget.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          (budget.percentage || 0) > 100
                            ? "destructive"
                            : (budget.percentage || 0) > 80
                              ? "secondary"
                              : "default"
                        }
                      >
                        {(budget.percentage || 0).toFixed(1)}%
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(budget)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(budget)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Terpakai: {formatCurrency(budget.actual_spent || 0)}</span>
                      <span>Budget: {formatCurrency(budget.monthly_limit)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (budget.percentage || 0) > 100
                            ? "bg-red-500"
                            : (budget.percentage || 0) > 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Sisa: {formatCurrency(budget.remaining || 0)}</span>
                      <span>{(budget.percentage || 0) > 100 ? "Over Budget!" : "On Track"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Budget Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget" : "Tambah Budget Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Bulan</Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(value) => setFormData({ ...formData, month: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Tahun</Label>
                <Select
                  value={formData.year.toString()}
                  onValueChange={(value) => setFormData({ ...formData, year: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_limit">Limit Budget (Rp)</Label>
              <Input
                id="monthly_limit"
                type="number"
                placeholder="500000"
                value={formData.monthly_limit}
                onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                min="0"
                step="10000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi budget..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                {loading ? "Menyimpan..." : editingBudget ? "Perbarui" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
