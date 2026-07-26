import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

// Liste des remboursements d'un événement (les RLS filtrent aux participants)
router.get('/', async (req, res) => {
  const { data, error } = await req.supabase
    .from('festorga_settlements')
    .select('*')
    .eq('event_id', req.params.eventId)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Déclarer un remboursement — toujours en tant que débiteur (soi-même)
router.post('/', async (req, res) => {
  const { to_user_id, amount } = req.body;

  if (!to_user_id || !amount) {
    return res.status(400).json({ error: 'Destinataire et montant requis' });
  }

  const { data, error } = await req.supabase
    .from('festorga_settlements')
    .insert({
      event_id: req.params.eventId,
      from_user_id: req.user.id,
      to_user_id,
      amount,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// Confirmer un remboursement — la policy RLS ne laisse passer que le créditeur
router.patch('/:settlementId/confirm', async (req, res) => {
  const { data, error, count } = await req.supabase
    .from('festorga_settlements')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() }, { count: 'exact' })
    .eq('id', req.params.settlementId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  if (count === 0) return res.status(403).json({ error: 'Confirmation non autorisée' });

  res.json(data);
});

// Annuler (débiteur) ou refuser (créditeur) une déclaration en attente
router.delete('/:settlementId', async (req, res) => {
  const { error, count } = await req.supabase
    .from('festorga_settlements')
    .delete({ count: 'exact' })
    .eq('id', req.params.settlementId);

  if (error) return res.status(400).json({ error: error.message });
  if (count === 0) return res.status(403).json({ error: 'Action non autorisée' });

  res.status(204).send();
});

export default router;
