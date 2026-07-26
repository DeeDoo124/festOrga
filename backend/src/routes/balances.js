import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Fait correspondre à chaque étape le plus gros débiteur avec le plus gros
// créditeur : minimise en pratique le nombre de transactions nécessaires.
function computeSettlements(balances) {
  const creditors = balances.filter((b) => b.balance > 0.01).map((b) => ({ ...b })).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter((b) => b.balance < -0.01).map((b) => ({ ...b, balance: -b.balance })).sort((a, b) => b.balance - a.balance);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = round2(Math.min(debtors[i].balance, creditors[j].balance));
    transactions.push({
      from: debtors[i].user_id,
      fromName: debtors[i].display_name,
      to: creditors[j].user_id,
      toName: creditors[j].display_name,
      amount,
    });

    debtors[i].balance = round2(debtors[i].balance - amount);
    creditors[j].balance = round2(creditors[j].balance - amount);

    if (debtors[i].balance < 0.01) i++;
    if (creditors[j].balance < 0.01) j++;
  }

  return transactions;
}

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

  const total = round2(expenses.reduce((sum, e) => sum + Number(e.amount), 0));
  const share = participants.length ? round2(total / participants.length) : 0;

  const balances = participants.map((p) => {
    const paid = round2(expenses.filter((e) => e.author_id === p.user_id).reduce((sum, e) => sum + Number(e.amount), 0));
    // Un remboursement confirmé rapproche les deux parties de l'équilibre :
    // le débiteur doit moins, le créditeur reçoit moins.
    const settled = confirmedSettlements.reduce((sum, s) => {
      if (s.from_user_id === p.user_id) return sum + Number(s.amount);
      if (s.to_user_id === p.user_id) return sum - Number(s.amount);
      return sum;
    }, 0);
    return {
      user_id: p.user_id,
      display_name: p.display_name,
      paid,
      balance: round2(paid - share + settled),
    };
  });

  const nameByUserId = Object.fromEntries(participants.map((p) => [p.user_id, p.display_name]));
  const pendingSettlementsWithNames = pendingSettlements.map((s) => ({
    ...s,
    fromName: nameByUserId[s.from_user_id],
    toName: nameByUserId[s.to_user_id],
  }));

  const transactions = computeSettlements(balances);

  res.json({ total, share, balances, transactions, pendingSettlements: pendingSettlementsWithNames });
});

export default router;
