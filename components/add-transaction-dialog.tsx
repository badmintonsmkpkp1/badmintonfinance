"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransactionAdded: () => void
  members: Member[]
}

interface Member {
  id: string
  name: string
  class: string
  phone: string
  status: string
}

export function AddTransactionDialog({ open, onOpenChange, onTransactionAdded, members }: AddTransactionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.type || !formData.amount || !formData.description) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from("transactions").insert([
        {
          type: formData.type,
          amount: Number.parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          category: formData.category,
        },
      ])

      if (error) throw error

      toast({
        title: "Berhasil!",
        description: "Transaksi berhasil ditambahkan",
      })

      setFormData({
        type: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        category: "",
      })

      onTransactionAdded()
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error",
        description: "Gagal menambahkan transaksi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Jenis Transaksi</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">💰 Pemasukan</SelectItem>
                <SelectItem value="expense">💸 Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori (Opsional)</Label>
            <Select
              value={formData.category || ""}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kas-anggota">Kas Anggota</SelectItem>
                <SelectItem value="peralatan">Peralatan</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="konsumsi">Konsumsi</SelectItem>
                <SelectItem value="sewa-lapangan">Sewa Lapangan</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min="0"
              step="1000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Keterangan</Label>
            <Textarea
              id="description"
              placeholder="Contoh: Iuran bulanan anggota, Pembelian shuttlecock, dll."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
