import { useEffect, useState } from 'react';

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosBanner, setShowIosBanner] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // déjà installée, rien à montrer

    if (isIos()) {
      const dismissed = localStorage.getItem('festorga_ios_install_dismissed');
      if (!dismissed) setShowIosBanner(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const dismissIosBanner = () => {
    localStorage.setItem('festorga_ios_install_dismissed', '1');
    setShowIosBanner(false);
  };

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        style={{ width: '100%', margin: '0.5rem 0', background: 'var(--color-primary)' }}
      >
        📲 Installer l'app sur l'écran d'accueil
      </button>
    );
  }

  if (showIosBanner) {
    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.75rem', margin: '0.5rem 0', background: 'var(--color-card-bg)' }}>
        <div>📲 Installe Festorga : appuie sur <strong>Partager</strong> puis <strong>Sur l'écran d'accueil</strong></div>
        <button onClick={dismissIosBanner} style={{ marginTop: '0.5rem' }}>
          Compris
        </button>
      </div>
    );
  }

  return null;
}
