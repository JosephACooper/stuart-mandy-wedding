import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'local-preview-key',
)

export type Rsvp = {
  id: string
  created_at: string
  guest_name: string
  attending: boolean
  party_size: number
  guest_names: string | null
  dietary_requirements: string | null
  song_request: string | null
  message: string | null
}
