import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import EventNav from '../components/EventNav';

export default function Checklist() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [openThreadId, setOpenThreadId] = useState(null);

  const nameByUserId = Object.fromEntries(participants.map((p) => [p.user_id, p.display_name]));

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch(`/api/events/${eventId}/checklist`),
      apiFetch(`/api/events/${eventId}/participants`),
    ])
      .then(([checklistItems, eventParticipants]) => {
        setItems(checklistItems);
        setParticipants(eventParticipants);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [eventId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    try {
      await apiFetch(`/api/events/${eventId}/checklist`, { method: 'POST', body: JSON.stringify({ label: newLabel }) });
      setNewLabel('');
      load();
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
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssign = async (item, userId) => {
    try {
      await apiFetch(`/api/events/${eventId}/checklist/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ assigned_to: userId || null }),
      });
      load();
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
      setEditingCommentId(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet élément ?')) return;
    try {
      await apiFetch(`/api/events/${eventId}/checklist/${id}`, { method: 'DELETE' });
      load();
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
              <button onClick={() => setEditingCommentId(editingCommentId === item.id ? null : item.id)} title="Commentaire">
                💬
              </button>
              <button onClick={() => handleDelete(item.id)} title="Supprimer">
                🗑
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              <select
                value={item.assigned_to || ''}
                onChange={(e) => handleAssign(item, e.target.value)}
                style={{ minHeight: 'auto', padding: '0.25rem', fontSize: '0.85rem', width: 'auto' }}
              >
                <option value="">🙋 Non assigné</option>
                {participants.map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    🙋 {p.display_name}
                  </option>
                ))}
              </select>

              {item.is_checked && item.checked_by && (
                <span>✅ Coché par {nameByUserId[item.checked_by] || '?'}</span>
              )}
            </div>

            {item.comment && editingCommentId !== item.id && (
              <div style={{ fontStyle: 'italic', marginTop: '0.4rem', color: 'var(--color-muted)' }}>💬 {item.comment}</div>
            )}

            {editingCommentId === item.id && (
              <CommentEditor initialValue={item.comment || ''} onSave={(comment) => handleSaveComment(item, comment)} />
            )}

            <button
              onClick={() => setOpenThreadId(openThreadId === item.id ? null : item.id)}
              style={{ marginTop: '0.5rem', background: 'transparent', color: 'var(--color-muted)', border: 'none', minHeight: 'auto', padding: '0.25rem 0', fontWeight: 400, textDecoration: 'underline' }}
            >
              {openThreadId === item.id ? 'Fermer la discussion' : '💬 Discussion'}
            </button>

            {openThreadId === item.id && (
              <CommentThread eventId={eventId} itemId={item.id} />
            )}
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 && <p>Rien dans la checklist pour l'instant.</p>}
    </div>
  );
}

function CommentThread({ eventId, itemId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');

  const load = () => {
    setLoading(true);
    apiFetch(`/api/events/${eventId}/checklist/${itemId}/comments`)
      .then(setComments)
      .finally(() => setLoading(false));
  };

  useEffect(load, [eventId, itemId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await apiFetch(`/api/events/${eventId}/checklist/${itemId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setText('');
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await apiFetch(`/api/events/${eventId}/checklist/${itemId}/comments/${commentId}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ marginTop: '0.5rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--color-border)' }}>
      {loading && <p style={{ fontSize: '0.85rem' }}>Chargement...</p>}

      {comments.map((c) => (
        <div key={c.id} style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>
          <strong>{c.author_name}</strong> : {c.text}
          <button
            onClick={() => handleDeleteComment(c.id)}
            style={{ marginLeft: '0.5rem', background: 'transparent', border: 'none', color: 'var(--color-muted)', minHeight: 'auto', padding: 0, fontSize: '0.8rem' }}
          >
            🗑
          </button>
        </div>
      ))}

      {!loading && comments.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Aucun message pour l'instant.</p>}

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
        <input
          type="text"
          placeholder="Répondre..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1, fontSize: '0.9rem' }}
        />
        <button type="submit" style={{ fontSize: '0.9rem' }}>Envoyer</button>
      </form>
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
