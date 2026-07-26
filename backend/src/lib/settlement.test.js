import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBalances, computeSettlements, round2 } from './settlement.js';

test('round2 arrondit correctement à 2 décimales', () => {
  assert.equal(round2(10.006), 10.01);
  assert.equal(round2(3.14159), 3.14);
  assert.equal(round2(1 / 3), 0.33);
});

test('computeBalances — cas simple à deux personnes', () => {
  const participants = [
    { user_id: 'a', display_name: 'Alice' },
    { user_id: 'b', display_name: 'Bob' },
  ];
  const expenses = [{ author_id: 'a', amount: 40 }];

  const { total, share, balances } = computeBalances(participants, expenses, []);

  assert.equal(total, 40);
  assert.equal(share, 20);
  assert.equal(balances.find((b) => b.user_id === 'a').balance, 20); // a un crédit de 20
  assert.equal(balances.find((b) => b.user_id === 'b').balance, -20); // doit 20
});

test('computeBalances — participant sans dépense doit quand même sa part', () => {
  const participants = [
    { user_id: 'a', display_name: 'Alice' },
    { user_id: 'b', display_name: 'Bob' },
    { user_id: 'c', display_name: 'Chloé' },
  ];
  const expenses = [{ author_id: 'a', amount: 30 }];

  const { balances } = computeBalances(participants, expenses, []);
  const chloe = balances.find((b) => b.user_id === 'c');

  assert.equal(chloe.paid, 0);
  assert.equal(chloe.balance, -10); // part théorique de 10€, rien payé
});

test('computeBalances — montant impair réparti sur 3 personnes (arrondis)', () => {
  const participants = [
    { user_id: 'a', display_name: 'Alice' },
    { user_id: 'b', display_name: 'Bob' },
    { user_id: 'c', display_name: 'Chloé' },
  ];
  const expenses = [{ author_id: 'a', amount: 10 }];

  const { share } = computeBalances(participants, expenses, []);
  assert.equal(share, 3.33); // 10 / 3 arrondi à 2 décimales
});

test('computeBalances — un remboursement confirmé réduit les deux soldes concernés', () => {
  const participants = [
    { user_id: 'a', display_name: 'Alice' },
    { user_id: 'b', display_name: 'Bob' },
  ];
  const expenses = [{ author_id: 'a', amount: 40 }];
  const confirmedSettlements = [{ from_user_id: 'b', to_user_id: 'a', amount: 15 }];

  const { balances } = computeBalances(participants, expenses, confirmedSettlements);

  assert.equal(balances.find((b) => b.user_id === 'a').balance, 5); // 20 - 15 déjà reçus
  assert.equal(balances.find((b) => b.user_id === 'b').balance, -5); // -20 + 15 déjà payés
});

test('computeSettlements — aucune dépense, personne ne doit rien', () => {
  const balances = [
    { user_id: 'a', display_name: 'Alice', balance: 0 },
    { user_id: 'b', display_name: 'Bob', balance: 0 },
  ];
  assert.deepEqual(computeSettlements(balances), []);
});

test('computeSettlements — un seul participant, aucune transaction possible', () => {
  const balances = [{ user_id: 'a', display_name: 'Alice', balance: 0 }];
  assert.deepEqual(computeSettlements(balances), []);
});

test('computeSettlements — cas simple à deux personnes', () => {
  const balances = [
    { user_id: 'a', display_name: 'Alice', balance: 20 },
    { user_id: 'b', display_name: 'Bob', balance: -20 },
  ];
  const transactions = computeSettlements(balances);

  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].from, 'b');
  assert.equal(transactions[0].to, 'a');
  assert.equal(transactions[0].amount, 20);
});

test('computeSettlements — minimise le nombre de transactions à plusieurs', () => {
  // 4 personnes : deux créditeurs, deux débiteurs déséquilibrés différemment.
  // Un algorithme naïf "chacun rembourse chacun" ferait plus de transactions.
  const balances = [
    { user_id: 'a', display_name: 'Alice', balance: 30 },
    { user_id: 'b', display_name: 'Bob', balance: 10 },
    { user_id: 'c', display_name: 'Chloé', balance: -25 },
    { user_id: 'd', display_name: 'David', balance: -15 },
  ];
  const transactions = computeSettlements(balances);

  // Avec 2 créditeurs et 2 débiteurs, l'algorithme glouton ne peut jamais
  // avoir besoin de plus de (créditeurs + débiteurs - 1) transactions.
  assert.ok(transactions.length <= 3);

  // Le total remboursé doit correspondre exactement au total dû
  const totalTransfered = transactions.reduce((sum, t) => sum + t.amount, 0);
  assert.equal(totalTransfered, 40);
});

test('computeSettlements — les soldes < 1 centime sont ignorés (déjà équilibrés)', () => {
  const balances = [
    { user_id: 'a', display_name: 'Alice', balance: 0.005 },
    { user_id: 'b', display_name: 'Bob', balance: -0.005 },
  ];
  assert.deepEqual(computeSettlements(balances), []);
});
