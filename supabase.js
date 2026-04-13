const SUPABASE_URL = "https://kfrgapnkoawpkzgzikzq.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcmdhcG5rb2F3cGt6Z3ppa3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTY3MjcsImV4cCI6MjA4ODU3MjcyN30.7XSRKRRIwByl37MTsG3jFCD7iwhOBeCxmRI--EKAW8A"

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

console.log("Supabase connected:", window.supabaseClient)