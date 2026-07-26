import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

// Liste des items de la checklist (les RLS filtrent aux participants)
router.get('/', async (req, res) => {
  const { data, error } = await req.supabase
    .from('festorga_checklist_items')
    .select('*')
    .eq('event_id', req.params.eventId)
    .order('created_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Ajouter un item
router.post('/', async (req, res) => {
  const { label, comment } = req.body;
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'Le libellé est requis' });
  }

  const { data, error } = await req.supabase
    .from('festorga_checklist_items')
    .insert({ event_id: req.params.eventId, label: label.trim(), comment: comment?.trim() || null })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// Cocher/décocher, modifier le libellé ou le commentaire — n'importe quel participant
router.patch('/:itemId', async (req, res) => {
  const { label, comment, is_checked } = req.body;

  const updates = {};
  if (label !== undefined) updates.label = label.trim();
  if (comment !== undefined) updates.comment = comment?.trim() || null;
  if (is_checked !== undefined) {
    updates.is_checked = is_checked;
    updates.checked_by = is_checked ? req.user.id : null;
  }

  const { data, error } = await req.supabase
    .from('festorga_checklist_items')
    .update(updates)
    .eq('id', req.params.itemId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Supprimer un item — n'importe quel participant (liste commune)
router.delete('/:itemId', async (req, res) => {
  const { error, count } = await req.supabase
    .from('festorga_checklist_items')
    .delete({ count: 'exact' })
    .eq('id', req.params.itemId);

  if (error) return res.status(400).json({ error: error.message });
  if (count === 0) return res.status(404).json({ error: 'Item introuvable' });

  res.status(204).send();
});

export default router;
