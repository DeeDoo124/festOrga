import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Client admin — bypass les RLS. Réservé aux vérifications nécessaires
// AVANT qu'un utilisateur soit participant (ex: retrouver un événement par
// son code pour le rejoindre, compter les participants).
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Client scopé au token de l'utilisateur courant — respecte les RLS.
// À utiliser pour toutes les opérations normales (créer, lister, supprimer).
export function createUserClient(accessToken) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
