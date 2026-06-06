import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://xmdyovfcjogkarwxiyhb.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZHlvdmZjam9na2Fyd3hpeWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzEwOTgsImV4cCI6MjA5NjM0NzA5OH0.enoikMiWOmxEFw3J7si5lkNQDedhKksAJWHCmmNNl8U"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
