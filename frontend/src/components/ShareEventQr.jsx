import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function ShareEventQr() {
  const [open, setOpen] = useState(false);
  const appUrl = window.location.origin;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      >
        📱 Partager
      </button>

      {open && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '1.25rem',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            background: '#FFF8F0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}
        >
          <QRCodeSVG value={appUrl} size={180} fgColor="#2A2440" bgColor="#FFF8F0" />
          <p style={{ color: '#2A2440', fontSize: '0.85rem', wordBreak: 'break-all', marginTop: '0.75rem' }}>{appUrl}</p>
        </div>
      )}
    </div>
  );
}
