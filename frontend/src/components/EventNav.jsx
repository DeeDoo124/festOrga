import { Link, useLocation, useParams } from 'react-router-dom';

export default function EventNav() {
  const { eventId } = useParams();
  const location = useLocation();

  const tabs = [
    { to: `/events/${eventId}`, label: '💰 Dépenses' },
    { to: `/events/${eventId}/balances`, label: '⚖️ Soldes' },
    { to: `/events/${eventId}/checklist`, label: '✅ Checklist' },
  ];

  return (
    <nav style={{ display: 'flex', gap: '0.4rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const active = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            style={{
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
              borderRadius: 8,
              background: active ? 'var(--color-primary)' : 'var(--color-card-bg)',
              color: active ? 'var(--color-primary-text)' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
