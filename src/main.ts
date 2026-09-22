import Phaser from 'phaser';
import { button, drawCat, fish, label, panel, street } from './art';
import { format, GROUND, H, PLAYER, scoreFor, VERSION, W, worldSpeed } from './config';
import { getProgress, getSettings, saveProgress, saveSettings, storeRun } from './storage';
import { ensureProfile, getLeaderboard, getMyRank, getOrCreateSession, isOnline, submitRun, updateName, type RunResult } from './supabase';
import './style.css';
import './pwa';

const markScene = (name: string): void => { document.querySelector('#game')?.setAttribute('data-scene', name); };

function namePrompt(onDone: () => void): void {
  const existing = document.querySelector('.name-overlay');
  existing?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'name-overlay';
  const card = document.createElement('div');
  card.className = 'name-card';
  card.innerHTML = '<h2>你的貓咪叫什麼？</h2><p>取個名字，準備出發！</p><input maxlength="12" aria-label="玩家暱稱" /><div class="error"></div><button type="button">儲存暱稱</button>';
  overlay.append(card);
  document.body.append(overlay);
  const input = card.querySelector('input')!;
  input.value = getProgress().displayName || `旅貓${Math.floor(1000 + Math.random() * 9000)}`;
  const save = async () => {
    const value = input.value.trim();
    if (!/^[\p{L}\p{N}_]{2,12}$/u.test(value)) { card.querySelector('.error')!.textContent = '請輸入 2～12 個中文、英文、數字或底線'; return; }
    const progress = getProgress(); progress.displayName = value; saveProgress(progress);
    await updateName(value); await ensureProfile(value);
    overlay.remove(); onDone();
  };
  card.querySelector('button')!.addEventListener('click', save);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') void save(); });
  input.focus();
}

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create(): void {
    this.cameras.main.setBackgroundColor('#fff7e8');
    label(this, W/2, H/2, '貓咪正在準備出發…', 20);
    void getOrCreateSession().then(async online => {
      const name = getProgress().displayName;
      if (online && name) {
        await ensureProfile(name);
        const pending = getProgress().pendingBestRun;
        if (pending && await submitRun(pending)) { const p = getProgress(); delete p.pendingBestRun; saveProgress(p); }
      }
      this.scene.start('Menu');
    });
  }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create(): void {
    markScene('menu');
    street(this);
    panel(this, 23, 40, 344, 78, 0xfffbf1, 21);
    label(this, 101, 69, '🐾  CAT DASH', 16, '#8b6451');
    label(this, 104, 95, isOnline() ? '● 線上漫遊中' : '● 離線模式', 12, isOnline() ? '#579b78' : '#bd8666');
    const name = getProgress().displayName || '新來的小旅貓';
    label(this, 280, 68, name, 16);
    label(this, 280, 94, `最高分 ${format(getProgress().localBestScore)}`, 12, '#8b6451');
    label(this, W/2, 215, '貓咪跑酷', 48, '#714d3a');
    label(this, W/2, 259, '跳跳跳，追著小魚跑！', 17, '#876b5b');
    drawCat(this, W/2, 431, 2.25);
    fish(this, 88, 374).setScale(1.4).setAngle(-23);
    fish(this, 310, 353).setScale(1.1).setAngle(25);
    panel(this, 22, 554, 346, 251, 0xfffaf0, 28);
    button(this, W/2, 609, 286, 58, '開始遊戲  ▶', () => this.scene.start('Game'));
    button(this, W/2, 680, 286, 55, '排行榜  ★', () => this.scene.start('Leaderboard'), 0xb7dfc6);
    button(this, W/2, 749, 286, 55, '設定  ⚙', () => this.scene.start('Settings'), 0xffe3af);
    if (!getProgress().displayName) this.time.delayedCall(200, () => namePrompt(() => this.scene.restart()));
  }
}

type Obstacle = { x: number; width: number; height: number; kind: number; view: Phaser.GameObjects.Container; active: boolean };
type Pickup = { x: number; y: number; view: Phaser.GameObjects.Container; active: boolean };

class GameScene extends Phaser.Scene {
  private cat!: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private fishText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private elapsed = 0;
  private distance = 0;
  private fishCount = 0;
  private catY = GROUND - 27;
  private velocity = 0;
  private jumps = 0;
  private obstacleClock = 0;
  private fishClock = 0;
  private obstacles: Obstacle[] = [];
  private pickups: Pickup[] = [];
  private ended = false;
  constructor() { super('Game'); }
  create(): void {
    markScene('game');
    this.elapsed = this.distance = this.fishCount = this.obstacleClock = this.fishClock = 0;
    this.catY = GROUND - 27; this.velocity = 0; this.jumps = 0; this.ended = false; this.obstacles = []; this.pickups = [];
    street(this, true);
    this.cat = drawCat(this, 105, this.catY, 1.03);
    panel(this, 16, 38, 358, 82, 0xfffbf1, 20);
    label(this, 83, 61, '距離', 13, '#987a67');
    label(this, 195, 61, '小魚乾', 13, '#987a67');
    label(this, 310, 61, '分數', 13, '#987a67');
    this.distanceText = label(this, 83, 91, '0 m', 21);
    this.fishText = label(this, 195, 91, '0', 21);
    this.scoreText = label(this, 310, 91, '0', 21);
    button(this, 344, 157, 51, 48, 'Ⅱ', () => this.pause(), 0xfff0d2);
    label(this, W/2, 787, '點擊畫面或按空白鍵跳躍・可二段跳', 14, '#876b5b');
    this.input.on('pointerdown', () => this.jump());
    this.input.keyboard?.on('keydown-SPACE', () => this.jump());
    this.input.keyboard?.on('keydown-UP', () => this.jump());
    this.input.keyboard?.on('keydown-ESC', () => this.pause());
    this.events.once('shutdown', () => { this.input.keyboard?.off('keydown-SPACE'); this.input.keyboard?.off('keydown-UP'); this.input.keyboard?.off('keydown-ESC'); });
    this.game.events.on(Phaser.Core.Events.BLUR, this.pause, this);
    this.events.once('shutdown', () => this.game.events.off(Phaser.Core.Events.BLUR, this.pause, this));
  }
  private jump(): void {
    if (this.ended || this.scene.isActive('Pause') || this.jumps >= PLAYER.maxJumps) return;
    this.velocity = PLAYER.jumpVelocity * (this.jumps ? .88 : 1);
    this.jumps++;
    this.tweens.add({ targets: this.cat, angle: this.jumps === 2 ? 18 : -8, duration: 140, yoyo: true });
  }
  private pause(): void { if (!this.ended && this.scene.isActive('Game') && !this.scene.isActive('Pause')) { this.scene.launch('Pause'); this.scene.pause(); } }
  private spawnObstacle(): void {
    const kind = Phaser.Math.Between(0, 2);
    const width = [43, 68, 51][kind], height = [54, 17, 32][kind];
    const x = W + 35;
    const graphics = this.add.graphics();
    if (kind === 0) {
      graphics.fillStyle(0xc99a70).fillRoundedRect(-width/2, -height, width, height, 5);
      graphics.lineStyle(3, 0x654b3f).strokeRoundedRect(-width/2, -height, width, height, 5);
      graphics.lineStyle(2, 0xa77452).lineBetween(-width/2, -height/2, width/2, -height/2);
      graphics.fillStyle(0xf8d3a5).fillRect(-5, -height, 10, 14);
    } else if (kind === 1) {
      graphics.fillStyle(0x6199a7).fillEllipse(0, -5, width, 15);
      graphics.lineStyle(3, 0x476e77).strokeEllipse(0, -5, width, 15);
      graphics.fillStyle(0xd7f3eb).fillCircle(-14, -7, 3).fillCircle(10, -6, 2);
    } else {
      graphics.fillStyle(0x9daeb4).fillRoundedRect(-width/2, -height, width, height, 12);
      graphics.lineStyle(3, 0x4a626b).strokeRoundedRect(-width/2, -height, width, height, 12);
      graphics.fillStyle(0x49565b).fillCircle(-10, -17, 3).fillCircle(10, -17, 3);
      graphics.fillStyle(0xeb9a7d).fillCircle(0, -8, 3);
    }
    const view = this.add.container(x, GROUND, [graphics]);
    this.obstacles.push({ x, width, height, kind, view, active: true });
  }
  private spawnFish(): void {
    const count = Phaser.Math.Between(3, 5);
    const baseY = Phaser.Math.Between(485, 578);
    for (let i = 0; i < count; i++) {
      const x = W + 34 + i * 46;
      const y = baseY - Math.sin(i / Math.max(1, count - 1) * Math.PI) * 22;
      this.pickups.push({ x, y, view: fish(this, x, y), active: true });
    }
  }
  update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = Math.min(delta, 50) / 1000;
    this.elapsed += dt;
    const speed = worldSpeed(this.elapsed);
    this.distance += speed * dt / 16;
    this.velocity += PLAYER.gravityY * dt;
    this.catY = Math.min(GROUND - 27, this.catY + this.velocity * dt);
    if (this.catY >= GROUND - 27) { this.velocity = 0; this.jumps = 0; this.cat.angle = 0; }
    this.cat.y = this.catY + Math.sin(this.elapsed * 18) * (this.jumps ? 0 : 2);
    this.obstacleClock += dt; this.fishClock += dt;
    if (this.elapsed > 5 && this.obstacleClock > Math.max(1.1, Phaser.Math.Between(180, 260) / 100 / (speed / 280))) { this.spawnObstacle(); this.obstacleClock = 0; }
    if (this.fishClock > 2.4) { this.spawnFish(); this.fishClock = 0; }
    for (const o of this.obstacles) {
      if (!o.active) continue;
      o.x -= speed * dt * (o.kind === 2 ? 1.12 : 1); o.view.x = o.x;
      if (o.x < -55) { o.active = false; o.view.destroy(); continue; }
      const overlapX = Math.abs(o.x - 105) < (o.width + 32) / 2;
      const catBottom = this.catY + 24;
      if (overlapX && catBottom > GROUND - o.height + (o.kind === 1 ? 4 : 8)) { this.finish(); return; }
    }
    for (const f of this.pickups) {
      if (!f.active) continue;
      f.x -= speed * dt; f.view.x = f.x;
      if (f.x < -30) { f.active = false; f.view.destroy(); continue; }
      if (Math.abs(f.x - 105) < 28 && Math.abs(f.y - this.catY) < 37) {
        f.active = false; this.fishCount++;
        this.tweens.add({ targets: f.view, scale: 1.8, alpha: 0, duration: 180, onComplete: () => f.view.destroy() });
      }
    }
    this.distanceText.setText(`${format(this.distance)} m`);
    this.fishText.setText(format(this.fishCount));
    this.scoreText.setText(format(scoreFor(this.distance, this.fishCount)));
    if (this.elapsed >= 1800) this.finish();
  }
  private finish(): void {
    if (this.ended) return;
    this.ended = true;
    const run: RunResult = { score: scoreFor(this.distance, this.fishCount), distanceM: Math.floor(this.distance), fishCount: this.fishCount, durationMs: Math.max(1000, Math.floor(this.elapsed * 1000)) };
    this.scene.start('GameOver', { run });
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }
  create(): void {
    markScene('pause');
    this.add.rectangle(0, 0, W, H, 0x342b27, .5).setOrigin(0);
    panel(this, 31, 220, 328, 400);
    label(this, W/2, 275, '休息一下', 32);
    label(this, W/2, 314, '貓咪等你回來！', 16, '#957661');
    button(this, W/2, 378, 270, 54, '繼續跑  ▶', () => { this.scene.stop(); this.scene.resume('Game'); markScene('game'); });
    button(this, W/2, 445, 270, 54, '重新開始  ↺', () => { this.scene.stop('Game'); this.scene.stop(); this.scene.start('Game'); }, 0xb7dfc6);
    button(this, W/2, 512, 270, 54, '回首頁  ⌂', () => { this.scene.stop('Game'); this.scene.stop(); this.scene.start('Menu'); }, 0xffe3af);
    this.input.keyboard?.once('keydown-ESC', () => { this.scene.stop(); this.scene.resume('Game'); markScene('game'); });
  }
}

class GameOverScene extends Phaser.Scene {
  private run!: RunResult;
  constructor() { super('GameOver'); }
  init(data: { run: RunResult }): void { this.run = data.run; }
  create(): void {
    markScene('gameover');
    street(this);
    const isBest = storeRun(this.run);
    panel(this, 23, 115, 344, 615);
    label(this, W/2, 170, isBest ? '🎉  新紀錄！' : '跑得真棒！', 31);
    drawCat(this, W/2, 296, 1.4);
    label(this, W/2, 398, format(this.run.score), 52, '#d9854c');
    label(this, W/2, 443, '本局分數', 16, '#987a67');
    label(this, 115, 493, `距離  ${format(this.run.distanceM)} m`, 17);
    label(this, 278, 493, `小魚乾  ${this.run.fishCount}`, 17);
    const status = label(this, W/2, 533, '正在儲存分數…', 13, '#8a7565');
    void (async () => {
      const sent = await submitRun(this.run);
      if (sent) {
        const p = getProgress(); if (p.pendingBestRun?.score === this.run.score) { delete p.pendingBestRun; saveProgress(p); }
        const rank = await getMyRank(); status.setText(rank ? `已提交・目前第 ${rank.rank} 名` : '已提交排行榜');
      } else status.setText('分數已暫存，連線後可重新提交');
    })();
    button(this, W/2, 594, 280, 53, '再玩一次  ▶', () => this.scene.start('Game'));
    button(this, 112, 660, 144, 50, '排行榜', () => this.scene.start('Leaderboard'), 0xb7dfc6);
    button(this, 278, 660, 144, 50, '回首頁', () => this.scene.start('Menu'), 0xffe3af);
  }
}

class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }
  create(): void {
    markScene('leaderboard');
    street(this);
    panel(this, 18, 35, 354, 767);
    label(this, W/2, 87, '★  全球排行榜', 30);
    label(this, W/2, 122, '最會跑的貓咪都在這裡', 14, '#957661');
    button(this, 321, 170, 76, 41, '更新', () => this.scene.restart(), 0xb7dfc6);
    const loading = label(this, W/2, 414, isOnline() ? '載入排行榜中…' : '離線模式，暫時無法載入排行榜', 16, '#957661');
    if (isOnline()) void getLeaderboard().then(entries => {
      loading.destroy();
      if (!entries.length) { label(this, W/2, 414, '還沒有分數，快來當第一名！', 16); return; }
      const list = this.add.container(0, 0);
      entries.forEach((entry, i) => {
        const y = 211 + i * 53;
        const bg = this.add.graphics().fillStyle(entry.isCurrentUser ? 0xd7f1d9 : i < 3 ? 0xffebbc : 0xfff9ee).fillRoundedRect(38, y, 314, 45, 12);
        const rank = label(this, 65, y + 22, `${entry.rank}`, 17, i < 3 ? '#c48644' : '#715b4d');
        const name = label(this, 165, y + 22, entry.displayName.slice(0, 12), 16);
        const score = label(this, 310, y + 22, format(entry.bestScore), 17, '#d9844c');
        list.add([bg, rank, name, score]);
      });
      const maskShape = this.make.graphics({ x: 0, y: 0 }); maskShape.fillRect(30, 200, 330, 455);
      list.setMask(maskShape.createGeometryMask());
      let offset = 0;
      this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => { offset = Phaser.Math.Clamp(offset - dy, Math.min(0, 455 - entries.length * 53), 0); list.y = offset; });
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => { if (pointer.isDown && pointer.y > 200 && pointer.y < 655) { offset = Phaser.Math.Clamp(offset + pointer.velocity.y * .016, Math.min(0, 455 - entries.length * 53), 0); list.y = offset; } });
    }).catch(() => loading.setText('排行榜暫時無法載入，請稍後再試'));
    panel(this, 36, 669, 318, 53, 0xe8f3dc, 13);
    const mine = label(this, W/2, 695, '我的排名：尚無紀錄', 16);
    void getMyRank().then(entry => { if (entry) mine.setText(`我的排名  #${entry.rank}     ${format(entry.bestScore)} 分`); });
    button(this, W/2, 755, 278, 50, '返回首頁', () => this.scene.start('Menu'), 0xffe3af);
  }
}

class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }
  create(): void {
    markScene('settings');
    street(this);
    panel(this, 25, 94, 340, 650);
    label(this, W/2, 145, '設定', 32);
    const settings = getSettings();
    const rows: { key: keyof typeof settings; title: string; y: number }[] = [
      { key: 'musicEnabled', title: '背景音樂', y: 232 }, { key: 'soundEnabled', title: '遊戲音效', y: 300 }, { key: 'vibrationEnabled', title: '震動回饋', y: 368 }
    ];
    for (const row of rows) {
      label(this, 107, row.y, row.title, 18);
      const toggle = button(this, 286, row.y, 90, 43, settings[row.key] ? '開' : '關', () => { settings[row.key] = !settings[row.key]; saveSettings(settings); this.scene.restart(); }, 0xb7dfc6);
      toggle.setName(row.key);
    }
    button(this, W/2, 449, 270, 53, '修改暱稱', () => namePrompt(() => this.scene.restart()), 0xffe3af);
    label(this, W/2, 519, `玩家：${getProgress().displayName || '旅貓'}`, 16);
    label(this, W/2, 550, `版本 ${VERSION}  ・  ${isOnline() ? '線上' : '離線模式'}`, 13, '#957661');
    label(this, W/2, 592, '清除瀏覽器資料後，匿名帳號可能無法找回。', 12, '#957661');
    button(this, W/2, 644, 270, 44, '清除本機設定', () => {
      if (window.confirm('確定要清除本機設定與紀錄嗎？此動作無法復原。')) {
        localStorage.removeItem('cat-dash:settings:v1'); localStorage.removeItem('cat-dash:progress:v1'); this.scene.restart();
      }
    }, 0xffded1);
    button(this, W/2, 785, 270, 50, '返回首頁', () => this.scene.start('Menu'), 0xffe3af);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W, height: H,
  backgroundColor: '#fff7e8',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, GameScene, PauseScene, GameOverScene, LeaderboardScene, SettingsScene]
});
