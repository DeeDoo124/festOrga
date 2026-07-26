import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import EventNav from '../components/EventNav';

export default function Balances() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState({});

  const load = () => {
    setLoading(true);
    apiFetch(`/api/events/${eventId}/balances`)
      .then((d) => {
        setData(d);
        // Pré-remplit chaque transaction avec le montant suggéré, modifiable ensuite
        const initialAmounts = {};
        d.transactions.forEach((t, i) => {
          initialAmounts[i] = t.amount;
        });
        setAmounts(initialAmounts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [eventId]);

  const handleDeclarePaid = async (t, amount) => {
    if (!amount || amount <= 0) {
      alert('Montant invalide');
      return;
    }
    try {
      await apiFetch(`/api/events/${eventId}/settlements`, {
        method: 'POST',
        body: JSON.stringify({ to_user_id: t.to, amount }),
      });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirm = async (settlementId) => {
    try {
      await apiFetch(`/api/events/${eventId}/settlements/${settlementId}/confirm`, { method: 'PATCH' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (settlementId) => {
    try {
      await apiFetch(`/api/events/${eventId}/settlements/${settlementId}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <button onClick={() => navigate(`/events/${eventId}`)}>← Dépenses</button>
      <EventNav />
      <h1>⚖️ Soldes</h1>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {data && (
        <>
          <p>Total dépensé : <strong>{data.total.toFixed(2)} €</strong></p>
          <p>Part de chacun : <strong>{data.share.toFixed(2)} €</strong></p>

          {data.pendingSettlements.some((s) => s.to_user_id === user?.id) && (
            <>
              <h2>🔔 À confirmer</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {data.pendingSettlements
                  .filter((s) => s.to_user_id === user?.id)
                  .map((s) => (
                    <li key={s.id} style={{ border: '2px solid orange', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                      <div><strong>{s.fromName}</strong> dit t'avoir remboursé <strong>{Number(s.amount).toFixed(2)} €</strong></div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button onClick={() => handleConfirm(s.id)}>✅ Confirmer</button>
                        <button onClick={() => handleReject(s.id)}>❌ Refuser</button>
                      </div>
                    </li>
                  ))}
              </ul>
            </>
          )}

          {data.pendingSettlements.some((s) => s.from_user_id === user?.id) && (
            <>
              <h2>⏳ En attente de confirmation</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {data.pendingSettlements
                  .filter((s) => s.from_user_id === user?.id)
                  .map((s) => (
                    <li key={s.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                      <div>Tu as déclaré avoir remboursé <strong>{Number(s.amount).toFixed(2)} €</strong> à <strong>{s.toName}</strong></div>
                      <button onClick={() => handleReject(s.id)} style={{ marginTop: '0.5rem' }}>Annuler</button>
                    </li>
                  ))}
              </ul>
            </>
          )}

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
                  {b.balance > 0 && `▲ Doit recevoir ${b.balance.toFixed(2)} €`}
                  {b.balance < 0 && `▼ Doit payer ${Math.abs(b.balance).toFixed(2)} €`}
                  {b.balance === 0 && '● Équilibré'}
                </div>
              </li>
            ))}
          </ul>

          <h2>Remboursements à faire</h2>
          {data.transactions.length === 0 && <p>Tout le monde est déjà à l'équilibre 🎉</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data.transactions.map((t, i) => (
              <li key={i} style={{ border: '1px solid #ccc', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                <div><strong>{t.fromName}</strong> doit <strong>{t.amount.toFixed(2)} €</strong> à <strong>{t.toName}</strong></div>
                {t.from === user?.id && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amounts[i] ?? t.amount}
                      onChange={(e) => setAmounts({ ...amounts, [i]: e.target.value })}
                      style={{ width: '90px' }}
                    />
                    <button onClick={() => handleDeclarePaid(t, Number(amounts[i]))}>J'ai payé</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
