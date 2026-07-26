import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import EventNav from '../components/EventNav';

export default function Checklist() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [openCommentId, setOpenCommentId] = useState(null);

  const loadItems = () => {
    setLoading(true);
    apiFetch(`/api/events/${eventId}/checklist`)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadItems, [eventId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    try {
      await apiFetch(`/api/events/${eventId}/checklist`, { method: 'POST', body: JSON.stringify({ label: newLabel }) });
      setNewLabel('');
      loadItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (item) => {
    try {
      await apiFetch(`/api/events/${eventId}/checklist/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_checked: !item.is_checked }),
      });
      loadItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveComment = async (item, comment) => {
    try {
      await apiFetch(`/api/events/${eventId}/checklist/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ comment }),
      });
      setOpenCommentId(null);
      loadItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet élément ?')) return;
    try {
      await apiFetch(`/api/events/${eventId}/checklist/${id}`, { method: 'DELETE' });
      loadItems();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/')}>← Mes événements</button>
      <EventNav />
      <h1>✅ Checklist</h1>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          type="text"
          placeholder="Ajouter un élément..."
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit">➕</button>
      </form>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={item.is_checked} onChange={() => handleToggle(item)} style={{ minHeight: 'auto', width: '22px', height: '22px' }} />
              <span style={{ flex: 1, textDecoration: item.is_checked ? 'line-through' : 'none', opacity: item.is_checked ? 0.6 : 1 }}>
                {item.label}
              </span>
              <button onClick={() => setOpenCommentId(openCommentId === item.id ? null : item.id)} title="Commentaire">
                💬
              </button>
              <button onClick={() => handleDelete(item.id)} title="Supprimer">
                🗑
              </button>
            </div>

            {item.comment && openCommentId !== item.id && (
              <div style={{ fontStyle: 'italic', marginTop: '0.4rem', color: 'var(--color-muted)' }}>{item.comment}</div>
            )}

            {openCommentId === item.id && (
              <CommentEditor initialValue={item.comment || ''} onSave={(comment) => handleSaveComment(item, comment)} />
            )}
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 && <p>Rien dans la checklist pour l'instant.</p>}
    </div>
  );
}

function CommentEditor({ initialValue, onSave }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Commentaire..." style={{ flex: 1 }} />
      <button onClick={() => onSave(value)}>OK</button>
    </div>
  );
}
