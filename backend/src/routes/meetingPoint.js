import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

// Récupérer le point de RDV actuel (peut être vide s'il n'a jamais été fixé)
router.get('/', async (req, res) => {
  const { data, error } = await req.supabase
    .from('festorga_meeting_points')
    .select('*')
    .eq('event_id', req.params.eventId)
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data); // null si jamais défini
});

// Définir ou mettre à jour le point de RDV — n'importe quel participant
router.put('/', async (req, res) => {
  const { description, meeting_time, latitude, longitude } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'La description est requise' });
  }

  const { data, error } = await req.supabase
    .from('festorga_meeting_points')
    .upsert(
      {
        event_id: req.params.eventId,
        description: description.trim(),
        meeting_time: meeting_time?.trim() || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        set_by: req.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id' },
    )
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Effacer le point de RDV
router.delete('/', async (req, res) => {
  const { error } = await req.supabase
    .from('festorga_meeting_points')
    .delete()
    .eq('event_id', req.params.eventId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

export default router;
