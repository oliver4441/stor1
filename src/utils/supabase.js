import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://fdwoezyataxhdtgjlfxt.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkd29lenlhdGF4aGR0Z2psZnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzI4NjAsImV4cCI6MjA5Mzc0ODg2MH0.EdYm_7067vC16FJU5nocOnejoxAEHbeCatSuj4nYgnE"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
