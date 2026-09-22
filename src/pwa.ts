import { registerSW } from 'virtual:pwa-register';

function showUpdate(update: () => Promise<void>): void {
  if (document.querySelector('.update-notice')) return;
  const notice = document.createElement('div');
  notice.className = 'update-notice';
  notice.setAttribute('role', 'status');
  notice.textContent = '有新版本，更新後會重新開啟';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '更新遊戲';
  button.addEventListener('click', () => {
    button.disabled = true;
    button.textContent = '更新中…';
    void update().catch(() => {
      button.disabled = false;
      button.textContent = '重試更新';
    });
  });
  notice.append(button);
  document.body.append(notice);
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() { showUpdate(() => updateSW()); },
  onRegisteredSW(_url, registration) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void registration?.update();
    });
  }
});
