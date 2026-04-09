import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://zrffaisyidwbfzinblub.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZmZhaXN5aWR3YmZ6aW5ibHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzE1NTEsImV4cCI6MjA1OTEwNzU1MX0.qTHb3LJMBnhMIaKQDJZ_lV0hGMvH3sG9smFoFMFgFJg'
);
