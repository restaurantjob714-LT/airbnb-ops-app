import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ddxekcigqoncgxtemkhs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeGVrY2lncW9uY2d4dGVta2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTc3MzUsImV4cCI6MjA4OTUzMzczNX0.8bbVGIS85zp7v_UWUobvTsbYk59Dai9DyHrWHttjMEk'

export const supabase = createClient(supabaseUrl, supabaseKey)