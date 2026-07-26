import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://mxbmqyuadjdlnjfrfoti.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Ym1xeXVhZGpkbG5qZnJmb3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyODE5ODksImV4cCI6MjA5ODg1Nzk4OX0.pPRcok3xYA0HCZDao4LUjl0TEE2tD1oJmt6tJv4Ifes"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)