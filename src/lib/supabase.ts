import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://zrffaisyidwbfzinblub.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZmZhaXN5aWR3YmZ6aW5ibHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODYxODIsImV4cCI6MjA4OTg2MjE4Mn0.GSBNQqr8ppgMkknhe-aOlm5TJySnpSZh0MmocZGf0WQ'
);
