import Phaser from 'phaser';
import { GROUND, H, W } from './config';

const C = { ink: 0x594238, cream: 0xfff9eb, orange: 0xf4a660, mint: 0xa9d8c0, sky: 0xc8e9e3 };
export function label(scene: Phaser.Scene, x: number, y: number, value: string, size = 18, color = '#594238', bold = true): Phaser.GameObjects.Text {
  return scene.add.text(x, y, value, { fontFamily: 'Nunito, Noto Sans TC, sans-serif', fontSize: `${size}px`, fontStyle: bold ? '900' : '700', color, align: 'center' }).setOrigin(.5);
}
export function panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, fill = C.cream, radius = 24): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(C.ink, .18).fillRoundedRect(x + 2, y + 7, width, height, radius);
  g.fillStyle(fill).fillRoundedRect(x, y, width, height, radius);
  g.lineStyle(2, C.ink, .9).strokeRoundedRect(x, y, width, height, radius);
  return g;
}
export function button(scene: Phaser.Scene, x: number, y: number, width: number, height: number, value: string, action: () => void, fill = C.orange): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(C.ink, .3).fillRoundedRect(-width/2, -height/2 + 5, width, height, 16);
  g.fillStyle(fill).fillRoundedRect(-width/2, -height/2, width, height, 16);
  g.lineStyle(2, C.ink).strokeRoundedRect(-width/2, -height/2, width, height, 16);
  const t = label(scene, 0, -2, value, 19);
  const c = scene.add.container(x, y, [g, t]).setSize(width, height).setInteractive({ useHandCursor: true });
  c.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); action(); });
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.035, duration: 120 }));
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 120 }));
  return c;
}
export function drawCat(scene: Phaser.Scene, x: number, y: number, scale = 1): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  // A small plush-like mascot, drawn entirely with Phaser shapes.
  g.lineStyle(7, 0x704c3b).beginPath().arc(25, 7, 18, 4.5, 7.2).strokePath();
  g.lineStyle(5, 0xe99555).beginPath().arc(25, 7, 18, 4.5, 7.2).strokePath();
  g.lineStyle(2.5, C.ink);
  g.fillStyle(0xf4a365).fillRoundedRect(-25, -4, 50, 45, 20).strokeRoundedRect(-25, -4, 50, 45, 20);
  g.fillStyle(0xffe6c3).fillEllipse(0, 17, 32, 31);
  g.fillStyle(0xf4a365).fillRoundedRect(-24, 31, 20, 13, 7).strokeRoundedRect(-24, 31, 20, 13, 7);
  g.fillRoundedRect(4, 31, 20, 13, 7).strokeRoundedRect(4, 31, 20, 13, 7);
  g.fillStyle(0xf4a365).fillTriangle(-28, -24, -22, -51, -7, -31).strokeTriangle(-28, -24, -22, -51, -7, -31);
  g.fillTriangle(7, -31, 22, -51, 28, -24).strokeTriangle(7, -31, 22, -51, 28, -24);
  g.fillStyle(0xffc8ad).fillTriangle(-23, -33, -20, -44, -12, -31);
  g.fillTriangle(12, -31, 20, -44, 23, -33);
  g.fillStyle(0xf4a365).fillEllipse(0, -18, 67, 53);
  g.lineStyle(2.5, C.ink).strokeEllipse(0, -18, 67, 53);
  g.fillStyle(0xffedd3).fillEllipse(0, -5, 31, 18);
  g.fillStyle(0xe99153).fillRoundedRect(-8, -44, 16, 10, 5);
  g.fillRoundedRect(-26, -32, 10, 5, 3).fillRoundedRect(16, -32, 10, 5, 3);
  g.fillStyle(0x44382f).fillEllipse(-13, -22, 7, 10).fillEllipse(13, -22, 7, 10);
  g.fillStyle(0xffffff).fillCircle(-14, -25, 2).fillCircle(12, -25, 2);
  g.fillStyle(0xf5a6a1, .8).fillEllipse(-23, -12, 11, 6).fillEllipse(23, -12, 11, 6);
  g.fillStyle(0xe98485).fillTriangle(-4, -13, 4, -13, 0, -8);
  g.lineStyle(1.7, C.ink).lineBetween(0, -8, 0, -5).lineBetween(0, -5, -4, -3).lineBetween(0, -5, 4, -3);
  g.lineStyle(1.3, 0xa86a4d).lineBetween(-27, -5, -36, -8).lineBetween(-27, -1, -35, 1);
  g.lineBetween(27, -5, 36, -8).lineBetween(27, -1, 35, 1);
  g.fillStyle(0xffe6c3).fillCircle(-12, 36, 3).fillCircle(12, 36, 3);
  return scene.add.container(x, y, [g]).setScale(scale);
}
export function street(scene: Phaser.Scene, moving = false): Phaser.GameObjects.Container {
  const sky = scene.add.graphics().fillStyle(C.sky).fillRect(0, 0, W, H);
  sky.fillStyle(0xfff5d5).fillCircle(318, 168, 56);
  sky.fillStyle(0xffffff, .8).fillEllipse(73, 137, 115, 32).fillEllipse(239, 223, 82, 24);
  sky.fillStyle(0xb7d6c7).fillRect(0, 460, W, 120);
  for (let i = 0; i < 5; i++) {
    const bx = i * 100 - 25;
    sky.fillStyle(i % 2 ? 0xf7d6ae : 0xffeed1).fillRect(bx, 366 + (i % 2) * 35, 80, 190);
    sky.fillStyle(0xb98773).fillTriangle(bx - 8, 367 + (i % 2) * 35, bx + 40, 330 + (i % 2) * 35, bx + 88, 367 + (i % 2) * 35);
    sky.fillStyle(0xfaf4dc).fillRoundedRect(bx + 21, 410 + (i % 2) * 35, 22, 32, 5);
  }
  sky.fillStyle(0x91c9a4).fillRect(0, 538, W, 52);
  sky.fillStyle(0x719d79).fillRect(0, 585, W, 12);
  sky.fillStyle(0xd3b195).fillRect(0, 597, W, GROUND - 597);
  sky.fillStyle(0x7c5d4d).fillRect(0, GROUND, W, 8);
  sky.fillStyle(0xf6d4ae).fillRect(0, GROUND + 8, W, H - GROUND);
  const decor = scene.add.graphics();
  for (let i = 0; i < 8; i++) decor.fillStyle(0xffffff, .5).fillRoundedRect(i * 68 - 15, 745, 36, 6, 3);
  const c = scene.add.container(0, 0, [sky, decor]);
  if (moving) scene.tweens.add({ targets: decor, x: -68, duration: 600, repeat: -1, onRepeat: () => { decor.x = 0; } });
  return c;
}
export function fish(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(0xf7c965).fillEllipse(0, 0, 24, 12).fillTriangle(9, 0, 21, -10, 21, 10);
  g.lineStyle(2, C.ink).strokeEllipse(0, 0, 24, 12).strokeTriangle(9, 0, 21, -10, 21, 10);
  g.fillStyle(C.ink).fillCircle(-5, -1, 1.5);
  return scene.add.container(x, y, [g]);
}
