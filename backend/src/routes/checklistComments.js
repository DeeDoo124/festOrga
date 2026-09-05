import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

// Liste des commentaires d'un item (les RLS filtrent aux participants)
router.get('/', async (req, res) => {
  const { data, error } = await req.supabase
    .from('festorga_checklist_comments')
    .select('*')
    .eq('item_id', req.params.itemId)
    .order('created_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Ajouter un commentaire
router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Le message est requis' });
  }

  const authorName = req.user.user_metadata?.full_name || req.user.email;

  const { data, error } = await req.supabase
    .from('festorga_checklist_comments')
    .insert({
      item_id: req.params.itemId,
      event_id: req.params.eventId,
      author_id: req.user.id,
      author_name: authorName,
      text: text.trim(),
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// Marquer la discussion de cet item comme lue par l'utilisateur courant
router.put('/read', async (req, res) => {
  const { error } = await req.supabase
    .from('festorga_checklist_reads')
    .upsert(
      { item_id: req.params.itemId, user_id: req.user.id, last_read_at: new Date().toISOString() },
      { onConflict: 'item_id,user_id' },
    );

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

// Supprimer son propre commentaire — la policy RLS ne laisse passer que l'auteur
router.delete('/:commentId', async (req, res) => {
  const { error, count } = await req.supabase
    .from('festorga_checklist_comments')
    .delete({ count: 'exact' })
    .eq('id', req.params.commentId);

  if (error) return res.status(400).json({ error: error.message });
  if (count === 0) return res.status(403).json({ error: 'Suppression non autorisée' });

  res.status(204).send();
});

export default router;
