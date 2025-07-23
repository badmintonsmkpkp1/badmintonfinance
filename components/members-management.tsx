"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2, Phone, GraduationCap, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface Member {
  id: string
  name: string
  class: string
  phone: string
  status: string
}

interface MembersManagementProps {
  members: Member[]
  onDataUpdated: () => void
}

export function MembersManagement({ members, onDataUpdated }: MembersManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    class: "",
    phone: "",
    status: "active",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      class: "",
      phone: "",
      status: "active",
    })
    setEditingMember(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (member: Member) => {
    setFormData({
      name: member.name,
      class: member.class,
      phone: member.phone,
      status: member.status,
    })
    setEditingMember(member)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.class) {
      toast({
        title: "Error",
        description: "Nama dan kelas harus diisi",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (editingMember) {
        // Update existing member
        const { error } = await supabase
          .from("members")
          .update({
            name: formData.name,
            class: formData.class,
            phone: formData.phone,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMember.id)

        if (error) throw error

        toast({
          title: "Berhasil!",
          description: "Data anggota berhasil diperbarui",
        })
      } else {
        // Add new member
        const { error } = await supabase.from("members").insert([
          {
            name: formData.name,
            class: formData.class,
            phone: formData.phone,
            status: formData.status,
          },
        ])

        if (error) throw error

        toast({
          title: "Berhasil!",
          description: "Anggota baru berhasil ditambahkan",
        })
      }

      resetForm()
      setIsDialogOpen(false)
      onDataUpdated()
    } catch (error) {
      console.error("Error saving member:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan data anggota",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (member: Member) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus anggota ${member.name}?`)) {
      return
    }

    try {
      const { error } = await supabase.from("members").delete().eq("id", member.id)

      if (error) throw error

      toast({
        title: "Berhasil!",
        description: "Anggota berhasil dihapus",
      })

      onDataUpdated()
    } catch (error) {
      console.error("Error deleting member:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus anggota",
        variant: "destructive",
      })
    }
  }

  const activeMembers = members.filter((m) => m.status === "active")
  const inactiveMembers = members.filter((m) => m.status === "inactive")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Anggota</h2>
          <p className="text-gray-600">Kelola data anggota ekstrakurikuler badminton</p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Anggota
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Anggota Aktif</p>
                <p className="text-2xl font-bold text-green-600">{activeMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Anggota Tidak Aktif</p>
                <p className="text-2xl font-bold text-red-600">{inactiveMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Anggota</p>
                <p className="text-2xl font-bold text-blue-600">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggota</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada anggota terdaftar</p>
              <p className="text-sm text-gray-400">Tambahkan anggota pertama Anda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        member.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {member.status === "active" ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {member.class}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.status === "active" ? "default" : "secondary"}>
                      {member.status === "active" ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(member)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Member Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Edit Anggota" : "Tambah Anggota Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Kelas</Label>
              <Input
                id="class"
                placeholder="Contoh: 12 IPA 1"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP (Opsional)</Label>
              <Input
                id="phone"
                placeholder="Contoh: 081234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading ? "Menyimpan..." : editingMember ? "Perbarui" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
