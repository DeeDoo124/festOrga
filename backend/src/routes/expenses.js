import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

// Liste des dépenses d'un événement (les RLS filtrent déjà aux participants)
router.get('/', async (req, res) => {
  const { data, error } = await req.supabase
    .from('festorga_expenses')
    .select('*')
    .eq('event_id', req.params.eventId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Ajouter une dépense
router.post('/', async (req, res) => {
  const { title, amount, category, expense_date, comment } = req.body;

  if (!title?.trim() || !amount || !category) {
    return res.status(400).json({ error: 'Titre, montant et catégorie sont requis' });
  }

  const authorName = req.user.user_metadata?.full_name || req.user.email;

  const { data, error } = await req.supabase
    .from('festorga_expenses')
    .insert({
      event_id: req.params.eventId,
      author_id: req.user.id,
      author_name: authorName,
      title: title.trim(),
      amount,
      category,
      expense_date: expense_date || new Date().toISOString().slice(0, 10),
      comment: comment?.trim() || null,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// Modifier une dépense — la policy RLS ne laisse passer que l'auteur
router.put('/:expenseId', async (req, res) => {
  const { title, amount, category, expense_date, comment } = req.body;

  const { data, error, count } = await req.supabase
    .from('festorga_expenses')
    .update({ title: title?.trim(), amount, category, expense_date, comment: comment?.trim() || null }, { count: 'exact' })
    .eq('id', req.params.expenseId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Supprimer une dépense — la policy RLS ne laisse passer que l'auteur
router.delete('/:expenseId', async (req, res) => {
  const { error, count } = await req.supabase
    .from('festorga_expenses')
    .delete({ count: 'exact' })
    .eq('id', req.params.expenseId);

  if (error) return res.status(400).json({ error: error.message });
  if (count === 0) return res.status(403).json({ error: 'Suppression non autorisée' });

  res.status(204).send();
});

export default router;
