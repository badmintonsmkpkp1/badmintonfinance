"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface PdfReportGeneratorProps {
  formatCurrency: (amount: number) => string
}

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

export function PdfReportGenerator({ formatCurrency }: PdfReportGeneratorProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportType, setReportType] = useState("financial")
  const [loading, setLoading] = useState(false)

  const generateFinancialReport = async () => {
    setLoading(true)
    try {
      // Fetch transactions for the selected month
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .gte("date", `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-01`)
        .lt("date", `${selectedYear}-${(selectedMonth === 12 ? 1 : selectedMonth + 1).toString().padStart(2, "0")}-01`)
        .order("date", { ascending: true })

      if (transactionsError) throw transactionsError

      // Fetch budget data
      const { data: budgets, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("year", selectedYear)
        .eq("month", selectedMonth)

      if (budgetsError) throw budgetsError

      // Create PDF document
      const doc = new jsPDF()
      const monthName = months.find((m) => m.value === selectedMonth)?.label || ""

      // Add title
      doc.setFontSize(20)
      doc.text("Laporan Keuangan Ekstrakurikuler Badminton", 105, 20, { align: "center" })
      doc.setFontSize(16)
      doc.text(`${monthName} ${selectedYear}`, 105, 30, { align: "center" })

      // Add date generated
      doc.setFontSize(10)
      doc.text(`Dibuat pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`, 105, 40, { align: "center" })

      // Add summary
      const totalIncome =
        transactions?.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const totalExpense =
        transactions?.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const balance = totalIncome - totalExpense

      doc.setFontSize(12)
      doc.text("Ringkasan Keuangan:", 20, 55)
      doc.text(`Total Pemasukan: ${formatCurrency(totalIncome)}`, 30, 65)
      doc.text(`Total Pengeluaran: ${formatCurrency(totalExpense)}`, 30, 75)
      doc.text(`Saldo: ${formatCurrency(balance)}`, 30, 85)

      // Add transactions table
      doc.text("Daftar Transaksi:", 20, 100)

      const transactionRows =
        transactions?.map((t) => [
          format(new Date(t.date), "dd/MM/yyyy"),
          t.type === "income" ? "Pemasukan" : "Pengeluaran",
          t.category || "-",
          t.description,
          formatCurrency(t.amount),
        ]) || []

      // Use autoTable with proper typing
      ;(doc as any).autoTable({
        head: [["Tanggal", "Jenis", "Kategori", "Deskripsi", "Jumlah"]],
        body: transactionRows,
        startY: 105,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      })

      // Add budget comparison if available
      if (budgets && budgets.length > 0) {
        doc.addPage()
        doc.setFontSize(16)
        doc.text("Perbandingan Budget vs Aktual", 105, 20, { align: "center" })

        const budgetRows = await Promise.all(
          budgets.map(async (budget) => {
            const { data: transactions } = await supabase
              .from("transactions")
              .select("amount")
              .eq("type", "expense")
              .eq("category", budget.category)
              .gte("date", `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-01`)
              .lt(
                "date",
                `${selectedYear}-${(selectedMonth === 12 ? 1 : selectedMonth + 1).toString().padStart(2, "0")}-01`,
              )

            const actualSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
            const remaining = Number(budget.monthly_limit) - actualSpent
            const percentage = Number(budget.monthly_limit) > 0 ? (actualSpent / Number(budget.monthly_limit)) * 100 : 0

            return [
              budget.category.replace("-", " ").toUpperCase(),
              formatCurrency(Number(budget.monthly_limit)),
              formatCurrency(actualSpent),
              formatCurrency(remaining),
              `${percentage.toFixed(1)}%`,
            ]
          }),
        )
        ;(doc as any).autoTable({
          head: [["Kategori", "Budget", "Aktual", "Sisa", "Persentase"]],
          body: budgetRows,
          startY: 30,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        })
      }

      // Save the PDF with proper filename
      const filename = `Laporan_Keuangan_${monthName}_${selectedYear}.pdf`
      doc.save(filename)

      toast({
        title: "Berhasil!",
        description: `Laporan keuangan berhasil dibuat: ${filename}`,
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Gagal membuat laporan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMembershipReport = async () => {
    setLoading(true)
    try {
      // Fetch members
      const { data: members, error: membersError } = await supabase.from("members").select("*").order("name")

      if (membersError) throw membersError

      // Fetch payments for the selected month
      const { data: payments, error: paymentsError } = await supabase
        .from("member_payments")
        .select(`
        *,
        members (
          id,
          name,
          class
        )
      `)
        .eq("month", selectedMonth)
        .eq("year", selectedYear)

      if (paymentsError) throw paymentsError

      // Create PDF document
      const doc = new jsPDF()
      const monthName = months.find((m) => m.value === selectedMonth)?.label || ""

      // Add title
      doc.setFontSize(20)
      doc.text("Laporan Keanggotaan Ekstrakurikuler Badminton", 105, 20, { align: "center" })
      doc.setFontSize(16)
      doc.text(`${monthName} ${selectedYear}`, 105, 30, { align: "center" })

      // Add date generated
      doc.setFontSize(10)
      doc.text(`Dibuat pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`, 105, 40, { align: "center" })

      // Add summary
      const activeMembers = members?.filter((m) => m.status === "active") || []
      const paidMembers = payments?.length || 0
      const unpaidMembers = activeMembers.length - paidMembers
      const paymentRate = activeMembers.length > 0 ? (paidMembers / activeMembers.length) * 100 : 0

      doc.setFontSize(12)
      doc.text("Ringkasan Keanggotaan:", 20, 55)
      doc.text(`Total Anggota Aktif: ${activeMembers.length}`, 30, 65)
      doc.text(`Sudah Membayar: ${paidMembers}`, 30, 75)
      doc.text(`Belum Membayar: ${unpaidMembers}`, 30, 85)
      doc.text(`Persentase Pembayaran: ${paymentRate.toFixed(1)}%`, 30, 95)

      // Add payment status table
      doc.text("Status Pembayaran Kas:", 20, 110)

      // Create a map of member IDs who have paid
      const paidMemberIds = new Set(payments?.map((p) => p.member_id) || [])

      // Create rows for the table
      const memberRows = activeMembers.map((member) => [
        member.name,
        member.class,
        paidMemberIds.has(member.id) ? "Sudah Bayar" : "Belum Bayar",
        paidMemberIds.has(member.id)
          ? format(new Date(payments?.find((p) => p.member_id === member.id)?.payment_date || ""), "dd/MM/yyyy")
          : "-",
        paidMemberIds.has(member.id)
          ? formatCurrency(Number(payments?.find((p) => p.member_id === member.id)?.amount || 0))
          : "-",
      ])
      ;(doc as any).autoTable({
        head: [["Nama", "Kelas", "Status", "Tanggal Bayar", "Jumlah"]],
        body: memberRows,
        startY: 115,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      })

      // Save the PDF with proper filename
      const filename = `Laporan_Keanggotaan_${monthName}_${selectedYear}.pdf`
      doc.save(filename)

      toast({
        title: "Berhasil!",
        description: `Laporan keanggotaan berhasil dibuat: ${filename}`,
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Gagal membuat laporan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = () => {
    if (reportType === "financial") {
      generateFinancialReport()
    } else {
      generateMembershipReport()
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Generate Laporan PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Jenis Laporan</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Laporan Keuangan</SelectItem>
                    <SelectItem value="membership">Laporan Keanggotaan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bulan</label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
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
              <div>
                <label className="text-sm font-medium mb-1 block">Tahun</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
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

            <div className="flex justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
