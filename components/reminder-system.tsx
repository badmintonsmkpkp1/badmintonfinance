"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Send, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Reminder {
  id: string
  member_id: string
  month: number
  year: number
  reminder_date: string
  status: string
  message: string
  member?: {
    name: string
    class: string
    phone: string
  }
}

export function ReminderSystem() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_reminders")
        .select(`
          *,
          members (
            name,
            class,
            phone
          )
        `)
        .order("reminder_date", { ascending: true })

      if (error) throw error

      setReminders(data || [])
    } catch (error) {
      console.error("Error fetching reminders:", error)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  const generateReminders = async () => {
    setRefreshing(true)
    try {
      // Get current month and year
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      // Find active members who haven't paid this month
      const { data: unpaidMembers, error: membersError } = await supabase
        .from("members")
        .select("id, name, class, phone")
        .eq("status", "active")
        .not(
          "id",
          "in",
          `(
          SELECT member_id FROM member_payments 
          WHERE month = ${currentMonth} AND year = ${currentYear}
        )`,
        )

      if (membersError) throw membersError

      if (!unpaidMembers || unpaidMembers.length === 0) {
        toast({
          title: "Info",
          description: "Semua anggota sudah membayar bulan ini!",
        })
        setRefreshing(false)
        return
      }

      // Create reminders for unpaid members
      const reminderDate = new Date()
      reminderDate.setDate(reminderDate.getDate() + 3) // Set reminder for 3 days from now

      const reminderData = unpaidMembers.map((member) => ({
        member_id: member.id,
        month: currentMonth,
        year: currentYear,
        reminder_date: reminderDate.toISOString().split("T")[0],
        status: "pending",
        message: `Reminder: Pembayaran kas bulan ${format(new Date(), "MMMM yyyy", { locale: id })} belum dilakukan`,
      }))

      // Insert reminders
      const { error: insertError } = await supabase
        .from("payment_reminders")
        .upsert(reminderData, { onConflict: "member_id,month,year" })

      if (insertError) throw insertError

      toast({
        title: "Berhasil!",
        description: `${reminderData.length} reminder berhasil dibuat`,
      })

      fetchReminders()
    } catch (error) {
      console.error("Error generating reminders:", error)
      toast({
        title: "Error",
        description: "Gagal membuat reminder",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const sendReminder = async (reminder: Reminder) => {
    setLoading(true)
    try {
      // In a real app, this would send an actual message via WhatsApp, SMS, or email
      // For this demo, we'll just simulate sending and update the status

      // Wait for 1 second to simulate sending
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update reminder status
      const { error } = await supabase.from("payment_reminders").update({ status: "sent" }).eq("id", reminder.id)

      if (error) throw error

      toast({
        title: "Berhasil!",
        description: `Reminder untuk ${reminder.member?.name} berhasil dikirim`,
      })

      fetchReminders()
    } catch (error) {
      console.error("Error sending reminder:", error)
      toast({
        title: "Error",
        description: "Gagal mengirim reminder",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (reminder: Reminder) => {
    try {
      // Update reminder status
      const { error } = await supabase.from("payment_reminders").update({ status: "paid" }).eq("id", reminder.id)

      if (error) throw error

      toast({
        title: "Berhasil!",
        description: `${reminder.member?.name} ditandai sudah membayar`,
      })

      fetchReminders()
    } catch (error) {
      console.error("Error marking as paid:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui status",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Menunggu</Badge>
      case "sent":
        return <Badge variant="default">Terkirim</Badge>
      case "paid":
        return <Badge variant="success">Sudah Bayar</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Sistem Reminder Pembayaran
          </CardTitle>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={generateReminders} disabled={refreshing} variant="outline" size="sm">
              {refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Generate Reminder</span>
            </Button>
          </motion.div>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Belum ada reminder</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Klik tombol Generate Reminder untuk membuat reminder baru
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {reminders.map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 border rounded-lg bg-card dark:bg-card"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{reminder.member?.name}</h3>
                        <p className="text-sm text-muted-foreground">{reminder.member?.class}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reminder.member?.phone || "No phone number"}
                        </p>
                        <p className="text-xs mt-2">
                          <span className="font-medium">Tanggal Reminder:</span>{" "}
                          {format(new Date(reminder.reminder_date), "dd MMMM yyyy", { locale: id })}
                        </p>
                        <p className="text-xs mt-1">
                          <span className="font-medium">Bulan:</span>{" "}
                          {format(new Date(reminder.year, reminder.month - 1), "MMMM yyyy", { locale: id })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(reminder.status)}

                        <div className="flex gap-2 mt-2">
                          {reminder.status === "pending" && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => sendReminder(reminder)}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Kirim
                              </Button>
                            </motion.div>
                          )}

                          {reminder.status !== "paid" && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button size="sm" variant="outline" onClick={() => markAsPaid(reminder)}>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Tandai Lunas
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-muted rounded-md text-xs">
                      <AlertCircle className="h-3 w-3 inline-block mr-1" />
                      {reminder.message}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
