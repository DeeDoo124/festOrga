import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const CATEGORIES = [
  { value: 'nourriture', label: '🍔 Nourriture' },
  { value: 'boissons', label: '🍺 Boissons' },
  { value: 'transport', label: '🚗 Transport' },
  { value: 'camping', label: '⛺ Camping' },
  { value: 'divers', label: '🎟 Divers' },
];

export default function ExpenseForm() {
  const { eventId, expenseId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(expenseId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('nourriture');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    apiFetch(`/api/events/${eventId}/expenses`)
      .then((expenses) => {
        const expense = expenses.find((e) => e.id === expenseId);
        if (expense) {
          setTitle(expense.title);
          setAmount(String(expense.amount));
          setCategory(expense.category);
          setExpenseDate(expense.expense_date);
          setComment(expense.comment || '');
        }
      })
      .catch((err) => setError(err.message));
  }, [eventId, expenseId, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { title, amount: Number(amount), category, expense_date: expenseDate, comment };
      if (isEditing) {
        await apiFetch(`/api/events/${eventId}/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/events/${eventId}/expenses`, { method: 'POST', body: JSON.stringify(payload) });
      }
      navigate(`/events/${eventId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>{isEditing ? '✏️ Modifier la dépense' : '➕ Ajouter une dépense'}</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="text"
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ fontSize: '1.1rem', padding: '0.5rem' }}
        />
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Montant (€)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ fontSize: '1.1rem', padding: '0.5rem' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                padding: '0.75rem',
                fontSize: '1rem',
                border: category === c.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: 8,
                background: category === c.value ? 'var(--color-primary)' : 'var(--color-card-bg)',
                color: category === c.value ? 'var(--color-primary-text)' : 'var(--color-text)',
                fontWeight: category === c.value ? 700 : 400,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          required
          style={{ fontSize: '1.1rem', padding: '0.5rem' }}
        />

        <textarea
          placeholder="Commentaire (facultatif)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ fontSize: '1rem', padding: '0.5rem' }}
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={submitting} style={{ fontSize: '1.1rem', padding: '0.75rem' }}>
          {isEditing ? 'Enregistrer' : 'Ajouter'}
        </button>
      </form>
      <button onClick={() => navigate(`/events/${eventId}`)}>Annuler</button>
    </div>
  );
}
