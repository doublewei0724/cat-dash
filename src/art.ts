import Phaser from 'phaser';
import { playClick } from './audio';
import { GROUND, H, RENDER_SCALE, W } from './config';

const C = { ink: 0x594238, cream: 0xfff9eb, orange: 0xf4a660, mint: 0xa9d8c0, sky: 0xc8e9e3 };
export function label(scene: Phaser.Scene, x: number, y: number, value: string, size = 18, color = '#594238', bold = true): Phaser.GameObjects.Text {
  return scene.add.text(x, y, value, { fontFamily: 'Nunito, Noto Sans TC, sans-serif', fontSize: `${size}px`, fontStyle: bold ? '900' : '700', color, align: 'center', resolution: RENDER_SCALE }).setOrigin(.5);
}
export function panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, fill = C.cream, radius = 24): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(C.ink, .18).fillRoundedRect(x + 2, y + 7, width, height, radius);
  g.fillStyle(fill).fillRoundedRect(x, y, width, height, radius);
  g.lineStyle(2, C.ink, .9).strokeRoundedRect(x, y, width, height, radius);
  return g;
}
export function button(scene: Phaser.Scene, x: number, y: number, width: number, height: number, value: string, action: () => void, fill = C.orange, iconName?: IconName): Phaser.GameObjects.Container {
  const cssScale = document.querySelector('#game')!.clientHeight / H;
  width = Math.max(width, 44 / cssScale);
  height = Math.max(height, 44 / cssScale);
  const g = scene.add.graphics();
  g.fillStyle(C.ink, .3).fillRoundedRect(-width/2, -height/2 + 5, width, height, 16);
  g.fillStyle(fill).fillRoundedRect(-width/2, -height/2, width, height, 16);
  g.lineStyle(2, C.ink).strokeRoundedRect(-width/2, -height/2, width, height, 16);
  const t = label(scene, 0, -2, value, 19);
  const children: Phaser.GameObjects.GameObject[] = [g, t];
  if (iconName) {
    const iconSize = Math.min(height - 14, 30);
    const ic = icon(scene, 0, -2, iconName, iconSize);
    const gap = value ? 10 : 0;
    const totalW = t.width + gap + iconSize;
    t.x = value ? -totalW / 2 + t.width / 2 : 0;
    ic.x = value ? totalW / 2 - iconSize / 2 : 0;
    children.push(ic);
  }
  const c = scene.add.container(x, y, children).setSize(width, height).setInteractive({ useHandCursor: true });
  c.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); playClick(); action(); });
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.035, duration: 120 }));
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 120 }));
  return c;
}
export type IconName = 'paw' | 'play' | 'star' | 'gear' | 'pause' | 'replay' | 'home' | 'sparkle' | 'music' | 'sound' | 'vibrate' | 'trophy';
export function icon(scene: Phaser.Scene, x: number, y: number, name: IconName, size = 50): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  const ink = C.ink;
  if (name === 'paw') {
    g.lineStyle(2, ink).fillStyle(C.orange);
    g.fillEllipse(0, 8, 26, 19).strokeEllipse(0, 8, 26, 19);
    for (const [px, py] of [[-12, -9], [-4, -16], [5, -16], [13, -9]] as const) g.fillCircle(px, py, 6.4).strokeCircle(px, py, 6.4);
  } else if (name === 'play') {
    g.lineStyle(2.5, ink).fillStyle(C.cream);
    g.fillTriangle(-10, -15, -10, 15, 16, 0).strokeTriangle(-10, -15, -10, 15, 16, 0);
  } else if (name === 'star') {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 22 : 9;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    g.fillStyle(0xf7c965).fillPoints(points, true);
    g.lineStyle(2, ink).strokePoints(points, true);
    g.fillStyle(0xffffff, .85).fillCircle(7, -10, 2.6);
  } else if (name === 'gear') {
    g.lineStyle(2, ink).fillStyle(C.mint);
    for (let i = 0; i < 6; i++) {
      g.save();
      g.rotateCanvas(i * Math.PI / 3);
      g.fillRoundedRect(-5, -21, 10, 10, 3).strokeRoundedRect(-5, -21, 10, 10, 3);
      g.restore();
    }
    g.fillStyle(C.mint).fillCircle(0, 0, 15).strokeCircle(0, 0, 15);
    g.fillStyle(C.cream).fillCircle(0, 0, 6).strokeCircle(0, 0, 6);
  } else if (name === 'pause') {
    g.lineStyle(2, ink).fillStyle(ink, .85);
    g.fillRoundedRect(-11, -15, 8, 30, 3).strokeRoundedRect(-11, -15, 8, 30, 3);
    g.fillRoundedRect(3, -15, 8, 30, 3).strokeRoundedRect(3, -15, 8, 30, 3);
  } else if (name === 'replay') {
    g.lineStyle(4.5, ink).beginPath().arc(0, 0, 15, Phaser.Math.DegToRad(15), Phaser.Math.DegToRad(315)).strokePath();
    g.fillStyle(ink).fillTriangle(19, -7, 5, -8, 15, -19);
  } else if (name === 'home') {
    g.lineStyle(2.5, ink).fillStyle(0xb98773);
    g.fillTriangle(-19, -2, 0, -20, 19, -2).strokeTriangle(-19, -2, 0, -20, 19, -2);
    g.fillStyle(C.orange).fillRoundedRect(-14, -3, 28, 20, 3).strokeRoundedRect(-14, -3, 28, 20, 3);
    g.fillStyle(C.cream).fillRoundedRect(-5, 5, 10, 12, 2).strokeRoundedRect(-5, 5, 10, 12, 2);
  } else if (name === 'sparkle') {
    const spark = (cx: number, cy: number, r: number, color: number): void => {
      g.fillStyle(color);
      g.fillTriangle(cx, cy - r, cx - r * .28, cy, cx, cy + r).fillTriangle(cx, cy - r, cx + r * .28, cy, cx, cy + r);
      g.fillTriangle(cx - r, cy, cx, cy - r * .28, cx + r, cy).fillTriangle(cx - r, cy, cx, cy + r * .28, cx + r, cy);
    };
    spark(0, -2, 17, 0xf7c965);
    spark(-16, 10, 7, 0xf5a6a1);
    spark(15, 12, 6, 0xa9d8c0);
  } else if (name === 'music') {
    g.lineStyle(3, ink).fillStyle(0xf6b4ac).fillEllipse(-11, 12, 15, 10).strokeEllipse(-11, 12, 15, 10);
    g.fillStyle(0xf6b4ac).fillEllipse(10, 6, 15, 10).strokeEllipse(10, 6, 15, 10);
    g.lineStyle(4, ink).lineBetween(-4, 11, -4, -17).lineBetween(17, 5, 17, -22).lineBetween(-4, -17, 17, -22);
    g.lineStyle(3, 0xf6b4ac).lineBetween(-3, -16, 16, -21);
  } else if (name === 'sound') {
    g.lineStyle(2.5, ink).fillStyle(0xffd48e).fillTriangle(-18, -8, -5, -8, 8, -19).strokeTriangle(-18, -8, -5, -8, 8, -19);
    g.fillTriangle(-18, 8, -5, 8, 8, 19).strokeTriangle(-18, 8, -5, 8, 8, 19);
    g.fillRect(-18, -8, 17, 16).strokeRect(-18, -8, 17, 16);
    g.lineStyle(3, ink).beginPath().arc(5, 0, 14, -0.8, 0.8).strokePath();
    g.beginPath().arc(5, 0, 22, -0.7, 0.7).strokePath();
  } else if (name === 'vibrate') {
    g.lineStyle(2.5, ink).fillStyle(0xb7dfc6).fillRoundedRect(-12, -22, 24, 44, 6).strokeRoundedRect(-12, -22, 24, 44, 6);
    g.fillStyle(C.cream).fillRoundedRect(-8, -16, 16, 28, 3);
    g.fillStyle(C.orange).fillCircle(0, 17, 2.5);
    g.lineStyle(2, ink).lineBetween(-18, -12, -22, -8).lineBetween(-18, 3, -22, 7).lineBetween(18, -12, 22, -8).lineBetween(18, 3, 22, 7);
  } else if (name === 'trophy') {
    g.lineStyle(2.5, ink).fillStyle(0xf7c965).fillRoundedRect(-13, -19, 26, 26, 6).strokeRoundedRect(-13, -19, 26, 26, 6);
    g.lineStyle(3, ink).beginPath().arc(-13, -10, 10, 1.4, 4.6).strokePath();
    g.beginPath().arc(13, -10, 10, -1.45, 1.7).strokePath();
    g.fillStyle(0xffe9a7).fillEllipse(-5, -11, 7, 13);
    g.lineStyle(2.5, ink).lineBetween(0, 7, 0, 19);
    g.fillStyle(0xf7c965).fillRoundedRect(-13, 18, 26, 6, 3).strokeRoundedRect(-13, 18, 26, 6, 3);
  }
  return scene.add.container(x, y, [g]).setScale(size / 50);
}
export type CatRig = {
  container: Phaser.GameObjects.Container;
  baseScale: number;
  legFront: Phaser.GameObjects.Container;
  legBack: Phaser.GameObjects.Container;
  armFront: Phaser.GameObjects.Container;
  armBack: Phaser.GameObjects.Container;
  tail: Phaser.GameObjects.Graphics;
  setExpression: (expression: 'run' | 'rise' | 'fall' | 'land' | 'blink') => void;
};
export function drawCat(scene: Phaser.Scene, x: number, y: number, scale = 1): CatRig {
  const tail = scene.add.graphics();
  const tailPath = (width: number, color: number): void => {
    tail.lineStyle(width, color);
    const points = [[22, 26], [31, 28], [39, 24], [44, 17], [45, 9]];
    for (let i = 1; i < points.length; i++) tail.lineBetween(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
    tail.fillStyle(color);
    for (const [px, py] of points) tail.fillCircle(px, py, width / 2);
  };
  tailPath(8, C.ink);
  tailPath(5, 0xe9a367);
  tail.lineStyle(1.3, 0xffd49c).lineBetween(34, 26, 41, 22);

  const makeLeg = (side: -1 | 1): Phaser.GameObjects.Container => {
    const g = scene.add.graphics();
    g.fillStyle(0xf4aa70).fillEllipse(0, 7, 20, 13);
    g.fillStyle(0xffe6c3).fillEllipse(0, 9, 9, 4);
    return scene.add.container(side * 14, 36, [g]);
  };
  const legBack = makeLeg(-1);
  const legFront = makeLeg(1);

  const makeArm = (side: -1 | 1): Phaser.GameObjects.Container => {
    const arm = scene.add.graphics();
    arm.lineStyle(1.7, C.ink).fillStyle(0xf3ab70).fillRoundedRect(-6, 0, 12, 18, 6).strokeRoundedRect(-6, 0, 12, 18, 6);
    arm.fillStyle(0xffd7aa).fillEllipse(0, 15, 13, 9);
    arm.lineStyle(1, 0xc77e58).lineBetween(-2, 15, -2, 18).lineBetween(2, 15, 2, 18);
    return scene.add.container(side * 23, 10, [arm]);
  };
  const armBack = makeArm(-1);
  const armFront = makeArm(1);
  armBack.angle = -35;
  armFront.angle = 35;

  const g = scene.add.graphics();
  // One clean outline per body part avoids doubled shadows at the chin and feet.
  g.lineStyle(2.5, C.ink).fillStyle(0xe9965a).fillRoundedRect(-27, -4, 54, 46, 20).strokeRoundedRect(-27, -4, 54, 46, 20);
  g.fillStyle(0xffe9ca).fillEllipse(0, 18, 32, 29);
  g.lineStyle(2.5, C.ink).fillStyle(0xc67a49).fillTriangle(-30, -25, -23, -52, -6, -30).strokeTriangle(-30, -25, -23, -52, -6, -30);
  g.fillTriangle(6, -30, 23, -52, 30, -25).strokeTriangle(6, -30, 23, -52, 30, -25);
  g.fillStyle(0xf4a7a0).fillTriangle(-24, -35, -21, -47, -12, -33).fillTriangle(12, -33, 21, -47, 24, -35);
  g.fillStyle(0xffd4b6, .8).fillTriangle(-20, -40, -19, -44, -16, -39).fillTriangle(16, -39, 19, -44, 20, -40);
  g.lineStyle(2.5, C.ink).fillStyle(0xf2a768).fillEllipse(0, -19, 62, 50).strokeEllipse(0, -19, 62, 50);
  g.fillStyle(0xffc993, .65).fillEllipse(-13, -36, 18, 6);
  g.fillStyle(0xffefd6).fillEllipse(0, -6, 34, 20);
  g.fillStyle(0xd87e4c).fillRoundedRect(-7, -44, 14, 10, 5);
  g.fillRoundedRect(-26, -33, 9, 5, 3).fillRoundedRect(17, -33, 9, 5, 3);
  g.fillStyle(0xf6b4a5, .8).fillEllipse(-23, -11, 12, 7).fillEllipse(23, -11, 12, 7);
  g.lineStyle(1.4, 0xa96a52).lineBetween(-27, -5, -37, -9).lineBetween(-27, -1, -36, 1);
  g.lineBetween(27, -5, 37, -9).lineBetween(27, -1, 36, 1);
  // Tiny fur tufts and reflected light keep the silhouette readable on small screens.
  g.lineStyle(1.5, 0xffd49e).lineBetween(-28, -26, -33, -29).lineBetween(28, -26, 33, -29);
  g.fillStyle(0xffffff, .55).fillEllipse(-17, -38, 9, 3);

  const face = scene.add.graphics();
  let currentExpression = '';
  const setExpression = (expression: 'run' | 'rise' | 'fall' | 'land' | 'blink'): void => {
    if (currentExpression === expression) return;
    currentExpression = expression;
    face.clear();
    if (expression === 'land' || expression === 'blink') {
      face.lineStyle(2.5, C.ink).beginPath().arc(-13, -21, 4, .2, Math.PI - .2).strokePath();
      face.beginPath().arc(13, -21, 4, .2, Math.PI - .2).strokePath();
    } else {
      const eyeHeight = expression === 'rise' ? 13 : expression === 'fall' ? 11 : 9;
      face.fillStyle(0x4d362f).fillEllipse(-13, -22, 7, eyeHeight).fillEllipse(13, -22, 7, eyeHeight);
      face.fillStyle(0xffffff).fillCircle(-14, -25, 2.2).fillCircle(12, -25, 2.2);
      if (expression === 'rise') {
        face.lineStyle(1.6, 0x925b43).lineBetween(-18, -33, -9, -35).lineBetween(9, -35, 18, -33);
      }
    }
    face.fillStyle(0xe78182).fillTriangle(-4, -13, 4, -13, 0, -8);
    face.lineStyle(1.6, C.ink).lineBetween(0, -8, 0, -5);
    if (expression === 'rise' || expression === 'fall') {
      face.fillStyle(0x793f3c).fillEllipse(0, 0, expression === 'rise' ? 8 : 6, expression === 'rise' ? 10 : 7);
      face.fillStyle(0xffb5ae).fillEllipse(0, 3, 4, 2);
    } else {
      face.lineStyle(1.6, C.ink).lineBetween(0, -5, -4, -2).lineBetween(0, -5, 4, -2);
    }
  };
  setExpression('run');
  const container = scene.add.container(x, y, [tail, legBack, legFront, g, armBack, armFront, face]).setScale(scale);
  return { container, baseScale: scale, legFront, legBack, armFront, armBack, tail, setExpression };
}
const THEMES = [
  { sky: 0xc8e9e3, sky2: 0xb7d6c7, sun: 0xfff5d5, glow: 0, buildingA: 0xf7d6ae, buildingB: 0xffeed1, roof: 0xb98773, window: 0xfaf4dc, grass: 0x91c9a4, grassLine: 0x719d79, road: 0xd3b195, curb: 0x7c5d4d, sidewalk: 0xf6d4ae, stars: false },
  { sky: 0xf6cd9e, sky2: 0xe7ab8c, sun: 0xffb37a, glow: .25, buildingA: 0xe8a97e, buildingB: 0xf4c99a, roof: 0x8f5b45, window: 0xffdf9c, grass: 0x83b98a, grassLine: 0x5f8c68, road: 0xb98f78, curb: 0x5f4535, sidewalk: 0xe0b48c, stars: false },
  { sky: 0x8a7bab, sky2: 0x6f5f8a, sun: 0xffe7b3, glow: .35, buildingA: 0x6f5f86, buildingB: 0x83729a, roof: 0x4a3d5c, window: 0xffe27a, grass: 0x557a63, grassLine: 0x3c5a48, road: 0x6f5c62, curb: 0x362a30, sidewalk: 0x8a7275, stars: true },
  { sky: 0x24243f, sky2: 0x1a1a30, sun: 0xf5f3e7, glow: .45, buildingA: 0x2c2a45, buildingB: 0x373458, roof: 0x1c1a30, window: 0xffe27a, grass: 0x2e4a3c, grassLine: 0x203528, road: 0x3a3444, curb: 0x1a1622, sidewalk: 0x453f52, stars: true }
] as const;

export function street(scene: Phaser.Scene, moving = false, themeIndex = 0): Phaser.GameObjects.Container {
  const t = THEMES[Phaser.Math.Clamp(themeIndex, 0, THEMES.length - 1)];
  const sky = scene.add.graphics().fillStyle(t.sky).fillRect(0, 0, W, H);
  sky.fillStyle(t.sky2).fillRect(0, 460, W, 120);
  sky.fillStyle(t.grass).fillRect(0, 538, W, 52);
  sky.fillStyle(t.grassLine).fillRect(0, 585, W, 12);
  sky.fillStyle(t.road).fillRect(0, 597, W, GROUND - 597);
  sky.fillStyle(t.curb).fillRect(0, GROUND, W, 8);
  sky.fillStyle(t.sidewalk).fillRect(0, GROUND + 8, W, H - GROUND);

  const sun = scene.add.graphics();
  if (t.glow) sun.fillStyle(t.sun, t.glow).fillCircle(W - 72, 168, 84);
  sun.fillStyle(t.sun).fillCircle(W - 72, 168, 56);
  if (t.stars) {
    const rand = new Phaser.Math.RandomDataGenerator([`stars-${themeIndex}`]);
    for (let i = 0; i < 26; i++) sun.fillStyle(0xffffff, rand.realInRange(.4, .9)).fillCircle(rand.between(0, W), rand.between(20, 340), rand.realInRange(1, 2));
  }

  const clouds = scene.add.graphics();
  const drawClouds = (ox: number): void => {
    clouds.fillStyle(0xffffff, t.stars ? .18 : .8).fillEllipse(ox + 73, 137, 115, 32).fillEllipse(ox + W * .62, 223, 82, 24);
  };
  drawClouds(0); drawClouds(W);

  const buildings = scene.add.graphics();
  const drawBuildings = (ox: number): void => {
    for (let i = 0; i < Math.ceil(W / 100) + 1; i++) {
      const bx = ox + i * 100 - 25;
      buildings.fillStyle(i % 2 ? t.buildingA : t.buildingB).fillRect(bx, 366 + (i % 2) * 35, 80, 190);
      buildings.fillStyle(t.roof).fillTriangle(bx - 8, 367 + (i % 2) * 35, bx + 40, 330 + (i % 2) * 35, bx + 88, 367 + (i % 2) * 35);
      buildings.fillStyle(t.window).fillRoundedRect(bx + 21, 410 + (i % 2) * 35, 22, 32, 5);
    }
  };
  drawBuildings(0); drawBuildings(W);

  const decor = scene.add.graphics();
  for (let i = 0; i < Math.ceil(W / 68) + 1; i++) decor.fillStyle(0xffffff, .5).fillRoundedRect(i * 68 - 15, 745, 36, 6, 3);

  const c = scene.add.container(0, 0, [sky, sun, clouds, buildings, decor]);
  if (moving) {
    scene.tweens.add({ targets: clouds, x: -W, duration: 26000, repeat: -1, onRepeat: () => { clouds.x = 0; } });
    scene.tweens.add({ targets: buildings, x: -W, duration: 7000, repeat: -1, onRepeat: () => { buildings.x = 0; } });
    scene.tweens.add({ targets: decor, x: -68, duration: 600, repeat: -1, onRepeat: () => { decor.x = 0; } });
    c.setData('parallax', [clouds, buildings, decor]);
  }
  return c;
}
export function fish(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(0xf7c965).fillEllipse(0, 0, 24, 12).fillTriangle(9, 0, 21, -10, 21, 10);
  g.lineStyle(2, C.ink).strokeEllipse(0, 0, 24, 12).strokeTriangle(9, 0, 21, -10, 21, 10);
  g.fillStyle(C.ink).fillCircle(-5, -1, 1.5);
  return scene.add.container(x, y, [g]);
}
