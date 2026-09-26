import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const WHATSAPP_NUMERO = import.meta.env.VITE_WHATSAPP_NUMERO || '';

export const POKEMON_BUCKET = 'pokemon-imagens';
