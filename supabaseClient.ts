import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://avmbwggilwebofyroqol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bWJ3Z2dpbHdlYm9meXJvcW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNzkwNDIsImV4cCI6MjA4MTk1NTA0Mn0.DR5himNJgYL6T03Vf0tC5rL1EL50XX8Jx8VIY04mIbU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
