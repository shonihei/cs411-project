import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { TextureLoaderService } from '../services/texture-loader.service';
import { Globe } from './renders/globe';
import { Article } from './renders/article';
import { MouseEmitterService } from '../services/mouse-emitter.service';
import { RenderEventsService, EventType, RenderEvent } from '../services/render-events.service';
import { Vector2, Texture } from 'three';

@Component({
  selector: 'app-globe',
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.sass']
})
export class GlobeComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') canvasRef: ElementRef;

  private globe: Globe;
  readonly GLOBE_RADIUS = 200;

  public fieldOfView = 45;
  public nearClippingPane = 0.1;
  public farClippingPane = 10000;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  constructor(private textureLoaderService: TextureLoaderService,
              private mouseEmitter: MouseEmitterService,
              private renderEvents: RenderEventsService) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.textureLoaderService
      .getTexture('../assets/img/earthDark.jpg')
      .subscribe(texture => this.initializeRender(texture));
    this.renderEvents.events$
      .subscribe(e => this.processRenderEvent(e));
  }

  private initializeRender(texture: Texture) {
    this.globe = new Globe(this.GLOBE_RADIUS, 50, 50, texture, this.canvas,
                           this.mouseEmitter, this.renderEvents);
    this.globe.init();

    const articles = [
      new Article({ lat: 40.7128, long: -74.0060 }),   // New York
      new Article({ lat: 35.6895, long: 139.69171 }),  // tokyo
      new Article({ lat: 34.69374, long: 135.50218 }), // osaka
      new Article({ lat: 30.79186, long: -83.78989 }), // Boston
      new Article({ lat: 47.60621, long: -122.33207 }), // seattle
      new Article({ lat: 34.05223, long: -118.24368 }), // LA
      new Article({ lat: 51.50853, long: -0.12574 }),  // London
      new Article({ lat: 41.38879, long: 2.15899 }),   // Barcelona
      new Article({ lat: 55.75222, long: 37.61556 }),  // Moscow
      new Article({ lat: 30.0444, long: 31.2357 }),     // cairo
      new Article({ lat: -23.5505, long: -46.6333 }),   // Sao Paulo
      new Article({ lat: -1.2921, long: 36.8219 }),     // Nairobi
      new Article({ lat: 6.5244, long: 3.3792 }),       // Lagos
      new Article({ lat: 19.0760, long: 72.8777 }),     // Mumbai
      new Article({ lat: 39.9042, long: 116.4074 }),    // Beijing
    ];
    for (const article of articles) {
      this.globe.addArticle(article);
    }
  }

  private processRenderEvent(e: RenderEvent) {
    switch (e.type) {
      case EventType.Click: {
        console.log(`clicked on ${e.target.name}`);
        break;
      }
      case EventType.Null: {
        break;
      }
    }
  }

  public onMouseDown(e: MouseEvent) {
    this.mouseEmitter.updateMouseCoord(new Vector2(e.clientX, e.clientY));
  }

  public onMouseUp() {
    // mouse position of infinity indicates to globe to stop raycasting
    this.mouseEmitter.updateMouseCoord(new Vector2(Infinity, Infinity));
  }
}
