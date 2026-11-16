import * as Phaser from 'phaser';
import worldImage from '@/assets/farm-island.png';
import oceanImage from '@/assets/archipelago.jpg';
import { ARCHIPELAGO_SIZE, WORLD_OFFSET, regions, regionAt } from './regions';
import { createFarmer } from './farmer';
import { CELL, WORLD_SIZE, findPath, objects, type Point, type WorldObject } from './world';
import { drawFields } from './crops-render';
import type { DemoField } from './demo-store';
import type { GameCallbacks, GameCommand } from './events';

export class FarmScene extends Phaser.Scene {
  private farmer?: Phaser.GameObjects.Sprite;
  private shadow?: Phaser.GameObjects.Ellipse;
  private marker?: Phaser.GameObjects.Arc;
  private path: Point[] = [];
  private target: WorldObject | undefined;
  private facing = 'down';
  private lastPosition = 0;
  private zoomFloor = 0.4;
  private overview = false;
  private dragging = false;
  private ripples: Phaser.GameObjects.Rectangle[] = [];
  private fields: DemoField[] = [];
  private cropLayer?: Phaser.GameObjects.Graphics;
  setFields(fields: DemoField[]) { this.fields = fields; }
  popText(fieldId: number, text: string) {
    const o = objects.find(x => x.id === `field-${fieldId}`); if (!o || !this.cropLayer) return;
    const t = this.add.text(o.x + o.w / 2, o.y + 20, text, { fontFamily: 'IBM Plex Sans Arabic', fontSize: '22px', color: '#fff5d8', stroke: '#234b3a', strokeThickness: 5 }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }
  constructor(private callbacks: GameCallbacks) { super('farm'); }
  preload() { this.load.image('world', worldImage); this.load.image('ocean', oceanImage); }
  create() {
    this.add.image(-WORLD_OFFSET, -WORLD_OFFSET, 'ocean').setOrigin(0).setDisplaySize(ARCHIPELAGO_SIZE, ARCHIPELAGO_SIZE);
    this.add.image(0, 0, 'world').setOrigin(0).setDisplaySize(WORLD_SIZE, WORLD_SIZE);
    for (let i = 0; i < 60; i++) {
      const x = -600 + (i % 12) * 260, y = -440 + Math.floor(i / 12) * 640;
      if (x > -120 && x < 1650 && y > -120 && y < 1650) continue;
      this.ripples.push(this.add.rectangle(x, y, 15 + i % 3 * 8, 3, 0xb5f5ef, 0.3).setDepth(1));
    }
    for (const region of regions) {
      const x = region.x + region.w / 2, y = region.y + region.h / 2;
      const lock = this.add.graphics().setDepth(4);
      lock.fillStyle(0x68492f).fillRect(x - 30, y - 34, 60, 48);
      lock.fillStyle(0xedcc79).fillRect(x - 24, y - 30, 48, 36);
      lock.lineStyle(8, 0x68492f).strokeRect(x - 14, y - 48, 28, 25);
      lock.fillStyle(0x68492f).fillRect(x - 4, y - 20, 8, 16);
      this.add.text(x, y + 30, region.name, { fontFamily: 'IBM Plex Sans Arabic', fontSize: '24px', color: '#fff5d8', stroke: '#234b3a', strokeThickness: 6 }).setOrigin(0.5).setDepth(4);
    }
    this.cropLayer = this.add.graphics().setDepth(5);
    createFarmer(this);
    this.shadow = this.add.ellipse(936, 632, 33, 12, 0x283a27, 0.25).setDepth(9);
    this.farmer = this.add.sprite(936, 632, 'farmer-down-0').setOrigin(0.5, 1).setScale(2.2).setDepth(10);
    this.marker = this.add.circle(0, 0, 13).setStrokeStyle(3, 0xffedb3).setFillStyle(0xffedb3, 0.1).setVisible(false).setDepth(8);
    const camera = this.cameras.main;
    camera.setBounds(-WORLD_OFFSET, -WORLD_OFFSET, ARCHIPELAGO_SIZE, ARCHIPELAGO_SIZE);
    camera.startFollow(this.farmer, true, 0.08, 0.08);
    this.resize();
    this.scale.on('resize', this.resize, this);
    this.input.on('pointerdown', () => { this.dragging = false; });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || pointer.getDistance() < 8) return;
      this.dragging = true; camera.stopFollow();
      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) return;
      const point = camera.getWorldPoint(pointer.x, pointer.y);
      const region = regionAt(point.x, point.y);
      if (region) { this.goTo(region.approach, region); return; }
      const object = objects.find(o => point.x >= o.x && point.x <= o.x + o.w && point.y >= o.y && point.y <= o.y + o.h);
      this.goTo(object ? object.approach : point, object);
    });
    this.input.on('wheel', (_p: unknown, _g: unknown, _x: number, dy: number) => this.zoom(Math.exp(-dy * 0.0015)));
    this.callbacks.ready();
  }
  private resize() {
    this.zoomFloor = Math.max(this.scale.width / ARCHIPELAGO_SIZE, this.scale.height / ARCHIPELAGO_SIZE);
    if (this.overview) this.showOverview();
    else this.cameras.main.setZoom(Math.max(this.zoomFloor, Math.min(this.scale.width / 1280, this.scale.height / 1200)));
  }
  private zoom(factor: number) { this.overview = false; this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * factor, this.zoomFloor, 2.5)); }
  private showOverview() {
    this.overview = true;
    this.cameras.main.stopFollow().setZoom(this.zoomFloor).centerOn(WORLD_SIZE / 2, WORLD_SIZE / 2);
  }
  command(command: GameCommand) {
    if (command === 'zoom-in') return this.zoom(1.15);
    if (command === 'zoom-out') return this.zoom(1 / 1.15);
    if (command === 'overview') { this.showOverview(); return; }
    if (command === 'center') { this.overview = false; this.resize(); if (this.farmer) this.cameras.main.startFollow(this.farmer, true, 0.08, 0.08); return; }
    const region = regions.find(r => r.id === command);
    if (region) { this.goTo(region.approach, region); return; }
    const object = objects.find(o => o.id === (command === 'home' ? 'home' : 'field-5'));
    if (object) this.goTo(object.approach, object);
  }
  private goTo(point: Point, object?: WorldObject) {
    if (!this.farmer) return;
    const path = findPath(this.farmer, point);
    if (!path.length) {
      if (object && Math.hypot(this.farmer.x - point.x, this.farmer.y - point.y) < CELL * 2) this.callbacks.arrived(object);
      return;
    }
    this.path = path; this.target = object;
    if (!this.overview) this.cameras.main.startFollow(this.farmer, true, 0.08, 0.08);
    this.marker?.setPosition(point.x, point.y).setVisible(true);
    this.callbacks.moving(true);
  }
  override update(time: number, delta: number) {
    for (let i = 0; i < this.ripples.length; i++) {
      const ripple = this.ripples[i];
      if (ripple) ripple.setAlpha(0.12 + (Math.sin(time / 1300 + i) + 1) * 0.13).setScale(1 + Math.sin(time / 2000 + i) * 0.25, 1);
    }
    if (this.cropLayer) drawFields(this.cropLayer, this.fields, Date.now(), time);
    if (!this.farmer) return;
    const next = this.path[0];
    if (next) {
      const dx = next.x - this.farmer.x, dy = next.y - this.farmer.y;
      const distance = Math.hypot(dx, dy), step = Math.min(delta, 40) * 0.21;
      if (distance <= step) { this.farmer.setPosition(next.x, next.y); this.path.shift(); }
      else this.farmer.setPosition(this.farmer.x + dx / distance * step, this.farmer.y + dy / distance * step);
      const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      this.facing = direction;
      this.farmer.play(`walk-${direction}`, true);
      if (!this.path.length) {
        this.farmer.stop().setTexture(`farmer-${this.facing}-0`);
        this.marker?.setVisible(false);
        this.callbacks.moving(false);
        if (this.target) { const object = this.target; this.target = undefined; this.callbacks.arrived(object); }
      }
    } else this.farmer.setScale(2.2, 2.2 + Math.sin(time / 550) * 0.018);
    this.shadow?.setPosition(this.farmer.x, this.farmer.y - 2);
    if (time - this.lastPosition > 150) { this.callbacks.position(this.farmer.x, this.farmer.y); this.lastPosition = time; }
  }
}