"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Calendar, Check, X, CreditCard, AlertCircle } from "lucide-react"
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

interface Member {
  id: string
  name: string
  class: string
  phone: string
  status: string
}

interface Payment {
  id: string
  member_id: string
  amount: number
  month: number
  year: number
  payment_date: string
  notes: string
  member?: Member
}

interface PaymentTrackingProps {
  members: Member[]
  formatCurrency: (amount: number) => string
  onDataUpdated: () => void
}

export function PaymentTracking({ members, formatCurrency, onDataUpdated }: PaymentTrackingProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({
    member_id: "",
    amount: "25000",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

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

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("member_payments")
        .select(`
          *,
          members (
            id,
            name,
            class,
            phone,
            status
          )
        `)
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .order("payment_date", { ascending: false })

      if (error) throw error

      const paymentsWithMembers =
        data?.map((payment) => ({
          ...payment,
          member: payment.members,
        })) || []

      setPayments(paymentsWithMembers)
    } catch (error) {
      console.error("Error fetching payments:", error)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [selectedMonth, selectedYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.member_id || !formData.amount) {
      toast({
        title: "Error",
        description: "Mohon pilih anggota dan masukkan jumlah pembayaran",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Check if payment already exists
      const { data: existingPayment } = await supabase
        .from("member_payments")
        .select("id")
        .eq("member_id", formData.member_id)
        .eq("month", formData.month)
        .eq("year", formData.year)
        .single()

      if (existingPayment) {
        toast({
          title: "Error",
          description: "Anggota sudah membayar kas untuk bulan ini",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Insert payment
      const { error: paymentError } = await supabase.from("member_payments").insert([
        {
          member_id: formData.member_id,
          amount: Number.parseFloat(formData.amount),
          month: formData.month,
          year: formData.year,
          payment_date: formData.payment_date,
          notes: formData.notes,
        },
      ])

      if (paymentError) throw paymentError

      // Add to transactions as income
      const member = members.find((m) => m.id === formData.member_id)
      const { error: transactionError } = await supabase.from("transactions").insert([
        {
          type: "income",
          amount: Number.parseFloat(formData.amount),
          description: `Kas ${months.find((m) => m.value === formData.month)?.label} ${formData.year} - ${member?.name}`,
          date: formData.payment_date,
        },
      ])

      if (transactionError) throw transactionError

      toast({
        title: "Berhasil!",
        description: "Pembayaran kas berhasil dicatat",
      })

      setFormData({
        member_id: "",
        amount: "25000",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        payment_date: new Date().toISOString().split("T")[0],
        notes: "",
      })

      setIsDialogOpen(false)
      fetchPayments()
      onDataUpdated()
    } catch (error) {
      console.error("Error adding payment:", error)
      toast({
        title: "Error",
        description: "Gagal mencatat pembayaran kas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const activeMembers = members.filter((m) => m.status === "active")
  const paidMemberIds = payments.map((p) => p.member_id)
  const unpaidMembers = activeMembers.filter((m) => !paidMemberIds.includes(m.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tracking Pembayaran Kas</h2>
          <p className="text-gray-600">Pantau pembayaran kas bulanan anggota</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Catat Pembayaran
        </Button>
      </div>

      {/* Month/Year Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <Label>Periode:</Label>
            </div>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Sudah Bayar</p>
                <p className="text-2xl font-bold text-green-600">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Belum Bayar</p>
                <p className="text-2xl font-bold text-red-600">{unpaidMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Terkumpul</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paid Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Sudah Bayar ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada yang membayar</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{payment.member?.name}</p>
                      <p className="text-sm text-gray-500">{payment.member?.class}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(payment.payment_date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                      <Badge variant="default" className="text-xs">
                        Lunas
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unpaid Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Belum Bayar ({unpaidMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unpaidMembers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Semua anggota sudah membayar! 🎉</p>
            ) : (
              <div className="space-y-3">
                {unpaidMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.class}</p>
                      {member.phone && <p className="text-xs text-gray-400">{member.phone}</p>}
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Belum Bayar
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran Kas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member_id">Anggota</Label>
              <Select
                value={formData.member_id}
                onValueChange={(value) => setFormData({ ...formData, member_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota" />
                </SelectTrigger>
                <SelectContent>
                  {activeMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.class}
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
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="25000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="0"
                step="1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Tanggal Bayar</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
