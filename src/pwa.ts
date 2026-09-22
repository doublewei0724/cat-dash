import { registerSW } from 'virtual:pwa-register';

function showUpdate(update: () => void): void {
  if (document.querySelector('.update-notice')) return;
  const notice = document.createElement('div');
  notice.className = 'update-notice';
  notice.setAttribute('role', 'status');
  notice.textContent = '貓咪跑酷有新版本！';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '更新遊戲';
  button.addEventListener('click', update);
  notice.append(button);
  document.body.append(notice);
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() { showUpdate(() => void updateSW()); },
  onRegisteredSW(_url, registration) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void registration?.update();
    });
  }
});
