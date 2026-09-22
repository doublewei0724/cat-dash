import Phaser from 'phaser';
import { playFish, playHit, playJump, startMusic, unlockAudio, vibrate } from './audio';
import { button, type CatRig, drawCat, fish, icon, label, panel, street } from './art';
import { contentWidth, format, GROUND, H, phaseFor, PLAYER, RENDER_SCALE, scoreFor, setViewport, VERSION, W, worldSpeed } from './config';
import { getProgress, getSettings, saveProgress, saveSettings, storeRun } from './storage';
import { ensureProfile, getLeaderboard, getMyRank, getOrCreateSession, isOnline, submitRun, updateName, type RunResult } from './supabase';
import './style.css';
import './pwa';

const markScene = (name: string): void => { document.querySelector('#game')?.setAttribute('data-scene', name); };
const prepareScene = (scene: Phaser.Scene): void => { scene.cameras.main.setOrigin(0, 0).setZoom(RENDER_SCALE); };

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
    prepareScene(this);
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
    prepareScene(this);
    markScene('menu');
    street(this);
    const headerW = contentWidth(46);
    const headerX = (W - headerW) / 2;
    panel(this, headerX, 40, headerW, 78, 0xfffbf1, 21);
    icon(this, headerX + 30, 69, 'paw', 22);
    label(this, headerX + 100, 69, 'CAT DASH', 16, '#8b6451');
    this.add.circle(headerX + 35, 95, 3.5, isOnline() ? 0x579b78 : 0xbd8666);
    label(this, headerX + 100, 95, isOnline() ? '線上漫遊中' : '離線模式', 12, isOnline() ? '#579b78' : '#bd8666');
    const name = getProgress().displayName || '新來的小旅貓';
    label(this, headerX + headerW - 85, 68, name, 16);
    label(this, headerX + headerW - 85, 94, `最高分 ${format(getProgress().localBestScore)}`, 12, '#8b6451');
    label(this, W/2, 215, '貓咪跑酷', 48, '#714d3a');
    label(this, W/2, 259, '跳跳跳，追著小魚跑！', 17, '#876b5b');
    const mascot = drawCat(this, W/2, 431, 2.25);
    this.tweens.add({ targets: mascot.container, y: 427, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [mascot.armFront, mascot.armBack], angle: 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.addEvent({ delay: 2600, loop: true, callback: () => {
      mascot.setExpression('blink');
      this.time.delayedCall(180, () => mascot.setExpression('run'));
    } });
    mascot.container.setSize(70, 95).setInteractive({ useHandCursor: true });
    mascot.container.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      mascot.setExpression('rise');
      this.tweens.add({ targets: mascot.container, scaleX: 2.4, scaleY: 2.4, duration: 140, yoyo: true });
      this.time.delayedCall(500, () => mascot.setExpression('run'));
    });
    fish(this, W/2 - 107, 374).setScale(1.4).setAngle(-23);
    fish(this, W/2 + 115, 353).setScale(1.1).setAngle(25);
    const cardW = contentWidth();
    const buttonW = Math.min(cardW - 60, 360);
    panel(this, (W - cardW)/2, 554, cardW, 251, 0xfffaf0, 28);
    button(this, W/2, 609, buttonW, 58, '開始遊戲', () => this.scene.start('Game'), undefined, 'play');
    button(this, W/2, 680, buttonW, 55, '排行榜', () => this.scene.start('Leaderboard'), 0xb7dfc6, 'star');
    button(this, W/2, 749, buttonW, 55, '設定', () => this.scene.start('Settings'), 0xffe3af, 'gear');
    if (!getProgress().displayName) this.time.delayedCall(200, () => namePrompt(() => this.scene.restart()));
  }
}

type Obstacle = { x: number; width: number; height: number; kind: number; view: Phaser.GameObjects.Container; active: boolean };
type Pickup = { x: number; y: number; view: Phaser.GameObjects.Container; active: boolean };

class GameScene extends Phaser.Scene {
  private cat!: CatRig;
  private background!: Phaser.GameObjects.Container;
  private hudElements: Phaser.GameObjects.GameObject[] = [];
  private hint!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private fishText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private elapsed = 0;
  private distance = 0;
  private fishCount = 0;
  private catY = GROUND - 27;
  private velocity = 0;
  private jumps = 0;
  private landedAt = -1;
  private obstacleClock = 0;
  private fishClock = 0;
  private obstacles: Obstacle[] = [];
  private pickups: Pickup[] = [];
  private ended = false;
  private theme = 0;
  constructor() { super('Game'); }
  create(): void {
    prepareScene(this);
    markScene('game');
    this.elapsed = this.distance = this.fishCount = this.obstacleClock = this.fishClock = 0;
    this.catY = GROUND - 27; this.velocity = 0; this.jumps = 0; this.landedAt = -1; this.ended = false; this.obstacles = []; this.pickups = [];
    this.theme = 0;
    this.background = street(this, true, this.theme);
    this.cat = drawCat(this, W * .27, this.catY, 1.03);
    const hudW = contentWidth(32);
    const hudX = (W - hudW) / 2;
    const column = hudW / 3;
    this.hudElements = [
      panel(this, hudX, 38, hudW, 82, 0xfffbf1, 20),
      label(this, hudX + column * .5, 61, '距離', 13, '#987a67'),
      label(this, hudX + column * 1.5, 61, '小魚乾', 13, '#987a67'),
      label(this, hudX + column * 2.5, 61, '分數', 13, '#987a67')
    ];
    this.distanceText = label(this, hudX + column * .5, 91, '0 m', 21);
    this.fishText = label(this, hudX + column * 1.5, 91, '0', 21);
    this.scoreText = label(this, hudX + column * 2.5, 91, '0', 21);
    this.hudElements.push(this.distanceText, this.fishText, this.scoreText);
    this.hudElements.push(button(this, hudX + hudW - 27, 157, 51, 48, '', () => this.pause(), 0xfff0d2, 'pause'));
    this.hint = label(this, W/2, 787, '點擊畫面或按空白鍵跳躍・可二段跳', 14, '#876b5b');
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
    this.cat.setExpression('rise');
    playJump();
    vibrate(15);
    this.tweens.add({ targets: this.cat.container, angle: this.jumps === 2 ? 12 : -6, duration: 140, yoyo: true });
  }
  private pause(): void { if (!this.ended && this.scene.isActive('Game') && !this.scene.isActive('Pause')) { this.scene.launch('Pause'); this.scene.pause(); } }
  reflow(deltaWidth: number): void {
    this.cameras.main.setZoom(RENDER_SCALE);
    for (const element of this.hudElements) {
      const positioned = element as Phaser.GameObjects.GameObject & { x: number };
      positioned.x += deltaWidth / 2;
      if (element instanceof Phaser.GameObjects.Text) element.setResolution(RENDER_SCALE);
    }
    this.hint.x = W / 2;
    this.hint.setResolution(RENDER_SCALE);
    this.cat.container.x = W * .27;
    this.tweens.killTweensOf(this.background.getData('parallax') as Phaser.GameObjects.GameObject[]);
    this.background.destroy();
    this.background = street(this, true, this.theme);
    this.children.sendToBack(this.background);
  }
  private swapTheme(next: number): void {
    this.theme = next;
    const oldBg = this.background;
    const newBg = street(this, true, next);
    newBg.setAlpha(0);
    this.children.moveBelow(newBg, this.cat.container);
    this.tweens.add({ targets: newBg, alpha: 1, duration: 900, onComplete: () => {
      this.tweens.killTweensOf(oldBg.getData('parallax') as Phaser.GameObjects.GameObject[]);
      oldBg.destroy();
    } });
    this.background = newBg;
  }
  private spawnObstacle(): void {
    const phase = phaseFor(this.elapsed);
    const kinds = phase >= 3 ? [0, 1, 2, 3, 4] : phase >= 1 ? [0, 1, 2, 3] : [0, 1, 2];
    const kind = kinds[Phaser.Math.Between(0, kinds.length - 1)];
    const width = [43, 68, 51, 46, 90][kind], height = [54, 17, 32, 74, 40][kind];
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
    } else if (kind === 2) {
      graphics.fillStyle(0x9daeb4).fillRoundedRect(-width/2, -height, width, height, 12);
      graphics.lineStyle(3, 0x4a626b).strokeRoundedRect(-width/2, -height, width, height, 12);
      graphics.fillStyle(0x49565b).fillCircle(-10, -17, 3).fillCircle(10, -17, 3);
      graphics.fillStyle(0xeb9a7d).fillCircle(0, -8, 3);
    } else if (kind === 3) {
      graphics.fillStyle(0xc99a70).fillRoundedRect(-width/2, -34, width, 34, 4).strokeRoundedRect(-width/2, -34, width, 34, 4);
      graphics.lineStyle(3, 0x654b3f).fillStyle(0xd9ad84).fillRoundedRect(-width/2 + 3, -height, width - 6, 34, 4).strokeRoundedRect(-width/2 + 3, -height, width - 6, 34, 4);
      graphics.lineStyle(2, 0xa77452).lineBetween(-width/2, -17, width/2, -17).lineBetween(-width/2 + 3, -height + 17, width/2 - 3, -height + 17);
    } else {
      graphics.fillStyle(0xc2a385).fillRect(-width/2, -height, 8, height).fillRect(width/2 - 8, -height, 8, height);
      graphics.lineStyle(3, 0x6b543f).strokeRect(-width/2, -height, 8, height).strokeRect(width/2 - 8, -height, 8, height);
      graphics.fillStyle(0xd9b58f).fillRect(-width/2, -height + 6, width, 8).fillRect(-width/2, -height + 22, width, 8);
      graphics.lineStyle(2, 0x6b543f).strokeRect(-width/2, -height + 6, width, 8).strokeRect(-width/2, -height + 22, width, 8);
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
    const phase = phaseFor(this.elapsed);
    if (phase !== this.theme) this.swapTheme(phase);
    this.distance += speed * dt / 16;
    this.velocity += PLAYER.gravityY * dt;
    const wasGrounded = this.catY >= GROUND - 27;
    this.catY = Math.min(GROUND - 27, this.catY + this.velocity * dt);
    const grounded = this.catY >= GROUND - 27;
    if (grounded) { this.velocity = 0; this.jumps = 0; this.cat.container.angle = 0; }
    this.cat.container.y = this.catY + Math.sin(this.elapsed * 18) * (this.jumps ? 0 : 2);
    if (grounded) {
      if (!wasGrounded) this.landedAt = this.elapsed;
      this.cat.setExpression(this.elapsed - this.landedAt < .2 ? 'land' : 'run');
      const cycle = this.elapsed * (16 + speed / 60);
      this.cat.legFront.angle = Math.sin(cycle) * 26;
      this.cat.legBack.angle = -Math.sin(cycle) * 26;
      this.cat.armFront.angle = -Math.sin(cycle) * 18;
      this.cat.armBack.angle = Math.sin(cycle) * 18;
      this.cat.tail.angle = Math.sin(this.elapsed * 5) * 9;
      if (!wasGrounded) {
        this.cat.container.setScale(this.cat.baseScale * 1.12, this.cat.baseScale * .86);
        this.tweens.add({ targets: this.cat.container, scaleX: this.cat.baseScale, scaleY: this.cat.baseScale, duration: 110, ease: 'Back.easeOut' });
      }
    } else {
      this.cat.setExpression(this.velocity < 0 ? 'rise' : 'fall');
      this.cat.legFront.angle = Phaser.Math.Linear(this.cat.legFront.angle, -32, .3);
      this.cat.legBack.angle = Phaser.Math.Linear(this.cat.legBack.angle, 28, .3);
      this.cat.armFront.angle = Phaser.Math.Linear(this.cat.armFront.angle, -24, .3);
      this.cat.armBack.angle = Phaser.Math.Linear(this.cat.armBack.angle, 24, .3);
      this.cat.tail.angle = Phaser.Math.Linear(this.cat.tail.angle, -16, .2);
      const stretch = Phaser.Math.Clamp(-this.velocity / 2400, -.12, .12);
      this.cat.container.setScale(this.cat.baseScale * (1 - stretch * .6), this.cat.baseScale * (1 + stretch));
    }
    this.obstacleClock += dt; this.fishClock += dt;
    if (this.elapsed > 5 && this.obstacleClock > Math.max(1.1, Phaser.Math.Between(180, 260) / 100 / (speed / 280))) { this.spawnObstacle(); this.obstacleClock = 0; }
    if (this.fishClock > 2.4) { this.spawnFish(); this.fishClock = 0; }
    for (const o of this.obstacles) {
      if (!o.active) continue;
      o.x -= speed * dt * (o.kind === 2 ? 1.12 : 1); o.view.x = o.x;
      if (o.x < -55) { o.active = false; o.view.destroy(); continue; }
      const overlapX = Math.abs(o.x - this.cat.container.x) < (o.width + 32) / 2;
      const catBottom = this.catY + 24;
      if (overlapX && catBottom > GROUND - o.height + (o.kind === 1 ? 4 : 8)) { this.finish(); return; }
    }
    for (const f of this.pickups) {
      if (!f.active) continue;
      f.x -= speed * dt; f.view.x = f.x;
      if (f.x < -30) { f.active = false; f.view.destroy(); continue; }
      if (Math.abs(f.x - this.cat.container.x) < 28 && Math.abs(f.y - this.catY) < 37) {
        f.active = false; this.fishCount++;
        playFish();
        vibrate(10);
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
    playHit();
    vibrate([40, 30, 40]);
    const run: RunResult = { score: scoreFor(this.distance, this.fishCount), distanceM: Math.floor(this.distance), fishCount: this.fishCount, durationMs: Math.max(1000, Math.floor(this.elapsed * 1000)) };
    this.scene.start('GameOver', { run });
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }
  create(): void {
    prepareScene(this);
    markScene('pause');
    this.add.rectangle(0, 0, W, H, 0x342b27, .5).setOrigin(0);
    const cardW = contentWidth(62, 460);
    const buttonW = Math.min(cardW - 58, 360);
    panel(this, (W - cardW)/2, 220, cardW, 400);
    label(this, W/2, 275, '休息一下', 32);
    label(this, W/2, 314, '貓咪等你回來！', 16, '#957661');
    button(this, W/2, 378, buttonW, 54, '繼續跑', () => { this.scene.stop(); this.scene.resume('Game'); markScene('game'); }, undefined, 'play');
    button(this, W/2, 445, buttonW, 54, '重新開始', () => { this.scene.stop('Game'); this.scene.stop(); this.scene.start('Game'); }, 0xb7dfc6, 'replay');
    button(this, W/2, 512, buttonW, 54, '回首頁', () => { this.scene.stop('Game'); this.scene.stop(); this.scene.start('Menu'); }, 0xffe3af, 'home');
    this.input.keyboard?.once('keydown-ESC', () => { this.scene.stop(); this.scene.resume('Game'); markScene('game'); });
  }
}

class GameOverScene extends Phaser.Scene {
  private run!: RunResult;
  private background!: Phaser.GameObjects.Container;
  constructor() { super('GameOver'); }
  init(data: { run: RunResult }): void { this.run = data.run; }
  create(): void {
    prepareScene(this);
    markScene('gameover');
    this.background = street(this);
    const isBest = storeRun(this.run);
    const cardW = contentWidth(46);
    const pairW = Math.min((cardW - 80)/2, 180);
    const pairOffset = pairW / 2 + 11;
    panel(this, (W - cardW)/2, 115, cardW, 615);
    if (isBest) {
      const record = label(this, W/2 + 13, 170, '新紀錄！', 31);
      icon(this, record.x - record.width / 2 - 22, 170, 'sparkle', 34);
    } else {
      label(this, W/2, 170, '跑得真棒！', 31);
    }
    drawCat(this, W/2, 296, 1.4);
    label(this, W/2, 398, format(this.run.score), 52, '#d9854c');
    label(this, W/2, 443, '本局分數', 16, '#987a67');
    label(this, W/2 - Math.min(cardW * .24, 118), 493, `距離  ${format(this.run.distanceM)} m`, 17);
    label(this, W/2 + Math.min(cardW * .24, 118), 493, `小魚乾  ${this.run.fishCount}`, 17);
    const status = label(this, W/2, 533, '正在儲存分數…', 13, '#8a7565');
    void (async () => {
      const sent = await submitRun(this.run);
      if (sent) {
        const p = getProgress(); if (p.pendingBestRun?.score === this.run.score) { delete p.pendingBestRun; saveProgress(p); }
        const rank = await getMyRank(); status.setText(rank ? `已提交・目前第 ${rank.rank} 名` : '已提交排行榜');
      } else status.setText('分數已暫存，連線後可重新提交');
    })();
    button(this, W/2, 594, Math.min(cardW - 64, 360), 53, '再玩一次', () => this.scene.start('Game'), undefined, 'play');
    button(this, W/2 - pairOffset, 660, pairW, 50, '排行榜', () => this.scene.start('Leaderboard'), 0xb7dfc6);
    button(this, W/2 + pairOffset, 660, pairW, 50, '回首頁', () => this.scene.start('Menu'), 0xffe3af);
  }
  reflow(deltaWidth: number): void {
    this.cameras.main.setZoom(RENDER_SCALE);
    for (const child of this.children.list) {
      if (child === this.background) continue;
      const positioned = child as Phaser.GameObjects.GameObject & { x: number };
      positioned.x += deltaWidth / 2;
      if (child instanceof Phaser.GameObjects.Text) child.setResolution(RENDER_SCALE);
    }
    this.background.destroy();
    this.background = street(this);
    this.children.sendToBack(this.background);
  }
}

class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }
  create(): void {
    prepareScene(this);
    markScene('leaderboard');
    street(this);
    const cardW = contentWidth(36, 540);
    const cardX = (W - cardW) / 2;
    const rowX = cardX + 20;
    const rowW = cardW - 40;
    panel(this, cardX, 35, cardW, 767);
    const title = label(this, W/2 + 15, 87, '全球排行榜', 30);
    icon(this, title.x - title.width / 2 - 24, 87, 'star', 30);
    label(this, W/2, 122, '最會跑的貓咪都在這裡', 14, '#957661');
    button(this, cardX + cardW - 53, 170, 76, 41, '更新', () => this.scene.restart(), 0xb7dfc6);
    const loading = label(this, W/2, 414, isOnline() ? '載入排行榜中…' : '離線模式，暫時無法載入排行榜', 16, '#957661');
    if (isOnline()) void getLeaderboard().then(entries => {
      loading.destroy();
      if (!entries.length) { label(this, W/2, 414, '還沒有分數，快來當第一名！', 16); return; }
      const list = this.add.container(0, 0);
      entries.forEach((entry, i) => {
        const y = 211 + i * 53;
        const bg = this.add.graphics().fillStyle(entry.isCurrentUser ? 0xd7f1d9 : i < 3 ? 0xffebbc : 0xfff9ee).fillRoundedRect(rowX, y, rowW, 45, 12);
        const rank = label(this, rowX + 27, y + 22, `${entry.rank}`, 17, i < 3 ? '#c48644' : '#715b4d');
        const name = label(this, rowX + rowW * .41, y + 22, entry.displayName.slice(0, 8), 16);
        const score = label(this, rowX + rowW - 44, y + 22, format(entry.bestScore), 17, '#d9844c');
        list.add([bg, rank, name, score]);
      });
      const maskShape = this.make.graphics({ x: 0, y: 0 }); maskShape.fillRect(rowX - 8, 200, rowW + 16, 455);
      list.setMask(maskShape.createGeometryMask());
      let offset = 0;
      this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => { offset = Phaser.Math.Clamp(offset - dy, Math.min(0, 455 - entries.length * 53), 0); list.y = offset; });
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => { if (pointer.isDown && pointer.y > 200 && pointer.y < 655) { offset = Phaser.Math.Clamp(offset + pointer.velocity.y * .016, Math.min(0, 455 - entries.length * 53), 0); list.y = offset; } });
    }).catch(() => loading.setText('排行榜暫時無法載入，請稍後再試'));
    panel(this, rowX, 669, rowW, 53, 0xe8f3dc, 13);
    const mine = label(this, W/2, 695, '我的排名：尚無紀錄', 16);
    void getMyRank().then(entry => { if (entry) mine.setText(`我的排名  #${entry.rank}     ${format(entry.bestScore)} 分`); });
    button(this, W/2, 755, Math.min(cardW - 76, 360), 50, '返回首頁', () => this.scene.start('Menu'), 0xffe3af);
  }
}

class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }
  create(): void {
    prepareScene(this);
    markScene('settings');
    street(this);
    const cardW = contentWidth(50);
    const cardX = (W - cardW) / 2;
    panel(this, cardX, 94, cardW, 650);
    label(this, W/2, 145, '設定', 32);
    const settings = getSettings();
    const rows: { key: keyof typeof settings; title: string; y: number }[] = [
      { key: 'musicEnabled', title: '背景音樂', y: 232 }, { key: 'soundEnabled', title: '遊戲音效', y: 300 }, { key: 'vibrationEnabled', title: '震動回饋', y: 368 }
    ];
    for (const row of rows) {
      label(this, cardX + 82, row.y, row.title, 18);
      const toggle = button(this, cardX + cardW - 79, row.y, 90, 43, settings[row.key] ? '開' : '關', () => { settings[row.key] = !settings[row.key]; saveSettings(settings); this.scene.restart(); }, 0xb7dfc6);
      toggle.setName(row.key);
    }
    button(this, W/2, 449, Math.min(cardW - 70, 360), 53, '修改暱稱', () => namePrompt(() => this.scene.restart()), 0xffe3af);
    label(this, W/2, 519, `玩家：${getProgress().displayName || '旅貓'}`, 16);
    label(this, W/2, 550, `版本 ${VERSION}  ・  ${isOnline() ? '線上' : '離線模式'}`, 13, '#957661');
    label(this, W/2, 592, '清除瀏覽器資料後，匿名帳號可能無法找回。', 12, '#957661');
    button(this, W/2, 644, Math.min(cardW - 70, 360), 44, '清除本機設定', () => {
      if (window.confirm('確定要清除本機設定與紀錄嗎？此動作無法復原。')) {
        localStorage.removeItem('cat-dash:settings:v1'); localStorage.removeItem('cat-dash:progress:v1'); this.scene.restart();
      }
    }, 0xffded1);
    button(this, W/2, 785, Math.min(cardW - 70, 360), 50, '返回首頁', () => this.scene.start('Menu'), 0xffe3af);
  }
}

const gameElement = document.querySelector<HTMLDivElement>('#game')!;
setViewport(gameElement.clientWidth, gameElement.clientHeight);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W * RENDER_SCALE, height: H * RENDER_SCALE,
  backgroundColor: '#fff7e8',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, GameScene, PauseScene, GameOverScene, LeaderboardScene, SettingsScene]
});

const unlockOnce = (): void => { unlockAudio(); startMusic(); document.removeEventListener('pointerdown', unlockOnce); document.removeEventListener('keydown', unlockOnce); };
document.addEventListener('pointerdown', unlockOnce);
document.addEventListener('keydown', unlockOnce);

let resizeFrame = 0;
new ResizeObserver(() => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    const oldWidth = W;
    const oldScale = RENDER_SCALE;
    setViewport(gameElement.clientWidth, gameElement.clientHeight);
    if (Math.abs(W - oldWidth) < 2 && Math.abs(RENDER_SCALE - oldScale) < .01) return;
    game.scale.setGameSize(Math.round(W * RENDER_SCALE), Math.round(H * RENDER_SCALE));
    const deltaWidth = W - oldWidth;
    const active = game.scene.getScenes(true);
    if (game.scene.isActive('Game') || game.scene.isPaused('Game')) {
      (game.scene.getScene('Game') as GameScene).reflow(deltaWidth);
    }
    for (const scene of active) {
      if (scene.scene.key === 'Game') continue;
      if (scene instanceof GameOverScene) scene.reflow(deltaWidth);
      else if (scene instanceof BootScene) {
        scene.cameras.main.setZoom(RENDER_SCALE);
        for (const child of scene.children.list) (child as Phaser.GameObjects.Text).x += deltaWidth / 2;
      } else scene.scene.restart();
    }
  });
}).observe(gameElement);
