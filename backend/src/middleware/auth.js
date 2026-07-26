import { supabaseAdmin, createUserClient } from '../lib/supabaseClient.js';

// Vérifie le token Bearer envoyé par le frontend, attache l'utilisateur
// (req.user) et un client Supabase scopé à son token (req.supabase) qui
// respecte les RLS pour toutes les requêtes suivantes de la route.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  req.user = data.user;
  req.supabase = createUserClient(token);
  next();
}
