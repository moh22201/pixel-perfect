import Phaser from 'phaser';
import worldImage from '@/assets/meadow-world.jpg';
import { createFarmer } from './farmer';
import { CELL, WORLD_SIZE, findPath, objects, type Point, type WorldObject } from './world';
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
  constructor(private callbacks: GameCallbacks) { super('farm'); }
  preload() { this.load.image('world', worldImage); }
  create() {
    this.add.image(0, 0, 'world').setOrigin(0).setDisplaySize(WORLD_SIZE, WORLD_SIZE);
    createFarmer(this);
    this.shadow = this.add.ellipse(936, 632, 33, 12, 0x283a27, 0.25).setDepth(9);
    this.farmer = this.add.sprite(936, 632, 'farmer-down-0').setOrigin(0.5, 1).setScale(2.2).setDepth(10);
    this.marker = this.add.circle(0, 0, 13).setStrokeStyle(3, 0xffedb3).setFillStyle(0xffedb3, 0.1).setVisible(false).setDepth(8);
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
    camera.startFollow(this.farmer, true, 0.08, 0.08);
    this.resize();
    this.scale.on('resize', this.resize, this);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const point = camera.getWorldPoint(pointer.x, pointer.y);
      const object = objects.find(o => point.x >= o.x && point.x <= o.x + o.w && point.y >= o.y && point.y <= o.y + o.h);
      this.goTo(object ? object.approach : point, object);
    });
    this.input.on('wheel', (_p: unknown, _g: unknown, _x: number, dy: number) => this.zoom(Math.exp(-dy * 0.0015)));
    this.callbacks.ready();
  }
  private resize() {
    this.zoomFloor = Math.max(this.scale.width / WORLD_SIZE, this.scale.height / WORLD_SIZE);
    this.cameras.main.setZoom(this.zoomFloor * 1.03);
  }
  private zoom(factor: number) { this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * factor, this.zoomFloor, this.zoomFloor * 2.6)); }
  command(command: GameCommand) {
    if (command === 'zoom-in') return this.zoom(1.15);
    if (command === 'zoom-out') return this.zoom(1 / 1.15);
    if (command === 'center') { this.resize(); return; }
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
    this.marker?.setPosition(point.x, point.y).setVisible(true);
    this.callbacks.moving(true);
  }
  override update(time: number, delta: number) {
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