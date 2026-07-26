export function round2(n) {
  return Math.round(n * 100) / 100;
}

// Fait correspondre à chaque étape le plus gros débiteur avec le plus gros
// créditeur : minimise en pratique le nombre de transactions nécessaires.
export function computeSettlements(balances) {
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

// Calcule ce que chaque participant a payé, sa part théorique, son solde
// (positif = créditeur, négatif = débiteur), en tenant compte des
// remboursements déjà confirmés.
export function computeBalances(participants, expenses, confirmedSettlements) {
  const total = round2(expenses.reduce((sum, e) => sum + Number(e.amount), 0));
  const share = participants.length ? round2(total / participants.length) : 0;

  const balances = participants.map((p) => {
    const paid = round2(expenses.filter((e) => e.author_id === p.user_id).reduce((sum, e) => sum + Number(e.amount), 0));
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

  return { total, share, balances };
}
