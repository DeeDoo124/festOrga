import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';

const router = Router();
const MAX_PARTICIPANTS = 20;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans caractères ambigus (0/O, 1/I)

function generateCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

router.use(requireAuth);

// Créer un événement — l'utilisateur en devient l'organisateur
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }

  let event = null;
  let lastError = null;

  for (let attempt = 0; attempt < 5 && !event; attempt++) {
    const { data, error } = await req.supabase
      .from('festorga_events')
      .insert({ name: name.trim(), code: generateCode(), organizer_id: req.user.id })
      .select()
      .single();

    if (!error) {
      event = data;
    } else if (error.code === '23505') {
      lastError = error; // collision de code, on retente
    } else {
      console.error('Erreur création événement:', error);
      return res.status(400).json({ error: error.message, details: error.details, hint: error.hint, code: error.code });
    }
  }

  if (!event) {
    return res.status(500).json({ error: lastError?.message || 'Impossible de créer l\'événement' });
  }

  const displayName = req.user.user_metadata?.full_name || req.user.email;

  const { error: participantError } = await req.supabase
    .from('festorga_participants')
    .insert({ event_id: event.id, user_id: req.user.id, role: 'organizer', display_name: displayName });

  if (participantError) {
    return res.status(400).json({ error: participantError.message });
  }

  res.status(201).json(event);
});

// Rejoindre un événement via son code
router.post('/join', async (req, res) => {
  const { code } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Le code est requis' });
  }

  // Lookup par code : nécessite le client admin, l'utilisateur n'est pas
  // encore participant donc les RLS lui interdiraient de voir l'événement.
  const { data: event, error: eventError } = await supabaseAdmin
    .from('festorga_events')
    .select('id, name, code')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (eventError || !event) {
    return res.status(404).json({ error: 'Code invalide' });
  }

  const { count, error: countError } = await supabaseAdmin
    .from('festorga_participants')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', event.id);

  if (countError) {
    return res.status(500).json({ error: countError.message });
  }

  if (count >= MAX_PARTICIPANTS) {
    return res.status(403).json({ error: 'Cet événement a atteint son nombre maximum de participants' });
  }

  // Insertion via le client scopé : la policy RLS autorise l'utilisateur à
  // s'ajouter lui-même. Conflit (déjà membre) traité comme un succès.
  const displayName = req.user.user_metadata?.full_name || req.user.email;

  const { error: joinError } = await req.supabase
    .from('festorga_participants')
    .insert({ event_id: event.id, user_id: req.user.id, role: 'participant', display_name: displayName });

  if (joinError && joinError.code !== '23505') {
    return res.status(400).json({ error: joinError.message });
  }

  res.json(event);
});

// Lister les événements de l'utilisateur courant
router.get('/', async (req, res) => {
  const { data, error } = await req.supabase
    .from('festorga_participants')
    .select('role, festorga_events(id, name, code, organizer_id, created_at)')
    .eq('user_id', req.user.id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const events = data
    .filter((row) => row.festorga_events)
    .map((row) => ({ ...row.festorga_events, myRole: row.role }));

  res.json(events);
});

// Supprimer un événement — la policy RLS ne laisse passer que l'organisateur
router.delete('/:id', async (req, res) => {
  const { error, count } = await req.supabase
    .from('festorga_events')
    .delete({ count: 'exact' })
    .eq('id', req.params.id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  if (count === 0) {
    return res.status(403).json({ error: 'Suppression non autorisée' });
  }

  res.status(204).send();
});

export default router;
