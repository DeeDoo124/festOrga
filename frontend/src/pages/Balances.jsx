import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Balances() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/events/${eventId}/balances`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div>
      <button onClick={() => navigate(`/events/${eventId}`)}>← Dépenses</button>
      <h1>⚖️ Soldes</h1>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {data && (
        <>
          <p>Total dépensé : <strong>{data.total.toFixed(2)} €</strong></p>
          <p>Part de chacun : <strong>{data.share.toFixed(2)} €</strong></p>

          <h2>Détail par personne</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data.balances.map((b) => (
              <li
                key={b.user_id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  fontWeight: b.user_id === user?.id ? 'bold' : 'normal',
                }}
              >
                <div>{b.display_name}{b.user_id === user?.id && ' (toi)'}</div>
                <div>A payé : {b.paid.toFixed(2)} €</div>
                <div style={{ color: b.balance > 0 ? 'green' : b.balance < 0 ? 'red' : 'inherit' }}>
                  {b.balance > 0 && `Doit recevoir ${b.balance.toFixed(2)} €`}
                  {b.balance < 0 && `Doit payer ${Math.abs(b.balance).toFixed(2)} €`}
                  {b.balance === 0 && 'Équilibré'}
                </div>
              </li>
            ))}
          </ul>

          <h2>Remboursements à faire</h2>
          {data.transactions.length === 0 && <p>Tout le monde est déjà à l'équilibre 🎉</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data.transactions.map((t, i) => (
              <li key={i} style={{ border: '1px solid #ccc', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                <strong>{t.fromName}</strong> doit <strong>{t.amount.toFixed(2)} €</strong> à <strong>{t.toName}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
