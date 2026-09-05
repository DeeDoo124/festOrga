import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { computeSettlements, computeBalances } from '../lib/settlement.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { eventId } = req.params;

  const [participantsRes, expensesRes, settlementsRes] = await Promise.all([
    req.supabase.from('festorga_participants').select('user_id, display_name').eq('event_id', eventId),
    req.supabase.from('festorga_expenses').select('author_id, amount').eq('event_id', eventId),
    req.supabase.from('festorga_settlements').select('*').eq('event_id', eventId),
  ]);

  if (participantsRes.error) return res.status(400).json({ error: participantsRes.error.message });
  if (expensesRes.error) return res.status(400).json({ error: expensesRes.error.message });
  if (settlementsRes.error) return res.status(400).json({ error: settlementsRes.error.message });

  const participants = participantsRes.data;
  const expenses = expensesRes.data;
  const settlements = settlementsRes.data;
  const confirmedSettlements = settlements.filter((s) => s.status === 'confirmed');
  const pendingSettlements = settlements.filter((s) => s.status === 'pending');

  const { total, share, balances } = computeBalances(participants, expenses, confirmedSettlements);

  const nameByUserId = Object.fromEntries(participants.map((p) => [p.user_id, p.display_name]));
  const pendingSettlementsWithNames = pendingSettlements.map((s) => ({
    ...s,
    fromName: nameByUserId[s.from_user_id],
    toName: nameByUserId[s.to_user_id],
  }));
  const confirmedSettlementsWithNames = confirmedSettlements
    .map((s) => ({ ...s, fromName: nameByUserId[s.from_user_id], toName: nameByUserId[s.to_user_id] }))
    .sort((a, b) => new Date(b.confirmed_at) - new Date(a.confirmed_at));

  const transactions = computeSettlements(balances);

  res.json({
    total,
    share,
    balances,
    transactions,
    pendingSettlements: pendingSettlementsWithNames,
    confirmedSettlements: confirmedSettlementsWithNames,
  });
});

export default router;
