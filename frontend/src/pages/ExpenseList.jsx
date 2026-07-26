import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { flushQueue, getQueuedExpenses } from '../lib/offlineQueue';

const CATEGORY_ICONS = {
  nourriture: '🍔',
  boissons: '🍺',
  transport: '🚗',
  camping: '⛺',
  divers: '🎟',
};

export default function ExpenseList() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const loadExpenses = () => {
    setLoading(true);
    apiFetch(`/api/events/${eventId}/expenses`)
      .then(setExpenses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    setPendingExpenses(getQueuedExpenses(eventId));
  };

  const syncAndReload = async () => {
    await flushQueue();
    loadExpenses();
  };

  useEffect(() => {
    syncAndReload();

    const handleOnline = () => syncAndReload();
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await apiFetch(`/api/events/${eventId}/expenses/${id}`, { method: 'DELETE' });
      loadExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingTotal = pendingExpenses.reduce((sum, p) => sum + Number(p.payload.amount), 0);
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0) + pendingTotal;

  return (
    <div>
      <button onClick={() => navigate('/')}>← Mes événements</button>
      <h1>💰 Dépenses</h1>

      {!isOnline && (
        <p style={{ background: 'orange', color: 'black', padding: '0.5rem', borderRadius: 8 }}>
          📡 Hors ligne — tes ajouts seront envoyés au retour du réseau
        </p>
      )}

      <p style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>Total : {total.toFixed(2)} €</p>

      <button onClick={() => navigate(`/events/${eventId}/expenses/new`)} style={{ fontSize: '1.1rem', padding: '0.75rem', width: '100%', margin: '0.5rem 0' }}>
        ➕ Ajouter une dépense
      </button>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pendingExpenses.map((p) => (
          <li key={p.localId} style={{ border: '2px dashed orange', borderRadius: 8, padding: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{CATEGORY_ICONS[p.payload.category]} {p.payload.title}</strong>
              <strong>{Number(p.payload.amount).toFixed(2)} €</strong>
            </div>
            <div>{p.payload.expense_date} — 🔄 en attente de synchro</div>
          </li>
        ))}

        {expenses.map((expense) => (
          <li key={expense.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{CATEGORY_ICONS[expense.category]} {expense.title}</strong>
              <strong>{Number(expense.amount).toFixed(2)} €</strong>
            </div>
            <div>{expense.expense_date} — payé par {expense.author_name}</div>
            {expense.comment && <div style={{ fontStyle: 'italic' }}>{expense.comment}</div>}

            {expense.author_id === user?.id && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={() => navigate(`/events/${eventId}/expenses/${expense.id}/edit`)}>✏️ Modifier</button>
                <button onClick={() => handleDelete(expense.id)}>🗑 Supprimer</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {!loading && expenses.length === 0 && pendingExpenses.length === 0 && <p>Aucune dépense pour l'instant.</p>}

      <Link to={`/events/${eventId}/balances`}>Voir les soldes →</Link>
    </div>
  );
}
