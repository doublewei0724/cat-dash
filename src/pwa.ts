const appUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
const workerUrl = new URL('sw.js', appUrl);

let activating = false;

function applyWaitingUpdate(registration: ServiceWorkerRegistration, onForeground = false): void {
  if (document.visibilityState !== 'visible' || !registration.waiting || !navigator.serviceWorker.controller || activating) return;
  const scene = document.querySelector('#game')?.getAttribute('data-scene');
  if (!onForeground && (scene === 'game' || scene === 'pause')) return;
  activating = true;
  void activateAndOpen(registration).catch(() => { activating = false; });
}

async function activateAndOpen(registration: ServiceWorkerRegistration): Promise<void> {
  const waiting = registration.waiting;
  if (waiting) {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => { cleanup(); resolve(); }, 8000);
      const onControl = (): void => { cleanup(); resolve(); };
      const cleanup = (): void => {
        window.clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener('controllerchange', onControl);
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControl);
      try { waiting.postMessage({ type: 'SKIP_WAITING' }); }
      catch (error) { cleanup(); reject(error); }
    });
  }
  // Older releases used a separate HTML cache that can point to removed assets.
  if ('caches' in window) await caches.delete('app-shell').catch(() => false);
  const next = new URL(appUrl);
  next.searchParams.set('updated', Date.now().toString(36));
  window.location.replace(next.href);
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register(workerUrl.href, { scope: appUrl.href }).then(registration => {
    const watch = (worker: ServiceWorker | null): void => {
      if (!worker) return;
      const installed = (): void => {
        if (worker.state === 'installed') applyWaitingUpdate(registration);
      };
      worker.addEventListener('statechange', installed);
      installed();
    };
    watch(registration.installing);
    registration.addEventListener('updatefound', () => watch(registration.installing));
    applyWaitingUpdate(registration, true);
    void registration.update().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        applyWaitingUpdate(registration, true);
        void registration.update().catch(() => {});
      }
    });
  }).catch(() => {});
}
