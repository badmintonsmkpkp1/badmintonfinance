import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabase: SupabaseClient | undefined

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Membuat instance Supabase **hanya** jika kedua ENV tersedia.
 * Jika tidak, lempar error yang menjelaskan cara memperbaiki konfigurasi.
 */
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    [
      "Supabase belum dikonfigurasi dengan benar.",
      "Pastikan Anda sudah menambahkan ENV:",
      "  NEXT_PUBLIC_SUPABASE_URL",
      "  NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "ke dalam file .env.local atau variabel proyek di Vercel/Supabase.",
    ].join("\n"),
  )
}

supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabase }
