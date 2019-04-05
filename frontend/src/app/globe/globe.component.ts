import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener
} from '@angular/core';
import { TextureLoaderService } from '../services/texture-loader.service';
import { Globe } from './renders/globe';
import { Article, ArticleInfo } from './renders/article';
import { MouseEmitterService } from '../services/mouse-emitter.service';
import { RenderEventsService, EventType, RenderEvent } from '../services/render-events.service';
import { Vector2, Texture } from 'three';
import { Subject } from 'rxjs';
import { LocationGraph, Node } from '../shared/location-graph';
import { LatLong } from '../shared/latlong';

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

  private hasSelectedArticle = false;
  private selectedArticle: Article;

  private resetSelection = new Subject<void>();
  private resetSelection$ = this.resetSelection.asObservable();

  private nearThreshold = 500; // anything within 500km is considered "near"
  private nearArticles: Article[] = [];
  private locationGraph = new LocationGraph();

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  constructor(private textureLoaderService: TextureLoaderService,
              private mouseEmitter: MouseEmitterService,
              private renderEvents: RenderEventsService) { }

  ngOnInit() {
    this.resetSelection$.subscribe(() => {
      this.hasSelectedArticle = false;
      this.selectedArticle = null;
      this.mouseEmitter.updateMouseCoord(new Vector2(Infinity, Infinity));
    });
  }

  ngAfterViewInit() {
    this.textureLoaderService
      .getTexture('../assets/img/earthBlueHD.png')
      .subscribe(texture => this.initializeRender(texture));
    this.renderEvents.events$
      .subscribe(e => this.processRenderEvent(e));
  }

  private initializeRender(texture: Texture) {
    this.globe = new Globe(this.GLOBE_RADIUS, 50, 50, texture, this.canvas,
                           this.mouseEmitter, this.renderEvents);
    this.globe.init();

    const articleInfo: ArticleInfo = {
      id: '',
      latlong: new LatLong(0, 0),
      source: 'The Reddit Times',
      author: 'John Doe',
      title: 'Something about bitcoins and machine learning',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \
      Curabitur eleifend bibendum molestie. Suspendisse et luctus \
      dolor. Nam ut ante',
      url: 'https://moderndogmagazine.com/breeds/shiba-inu-0',
      urlToImage: '../../assets/img/shiba.jpg',
      publishedAt: '2019-01-01',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \
      Curabitur eleifend bibendum molestie. Suspendisse et luctus \
      dolor. Nam ut ante in quam euismod ultrices. Suspendisse molestie \
      ipsum ut neque vulputate, ultrices lacinia turpis interdum. Aliquam \
      vitae pulvinar elit. Curabitur dignissim elementum aliquet. Curabitur \
      tincidunt purus et sem luctus tincidunt. Aliquam fermentum.',
    };

    const latlongs: LatLong[] = [
      new LatLong(40.7128,  -74.0060),   // New York
      new LatLong(35.6895,  139.69171),  // tokyo
      new LatLong(34.69374, 135.50218),  // osaka
      new LatLong(42.3601,  -71.0589),   // Boston
      new LatLong(27.9506,  -82.4572),   // Tampa
      new LatLong(47.60621, -122.33207), // seattle
      new LatLong(34.05223, -118.24368), // LA
      new LatLong(51.50853, -0.12574),   // London
      new LatLong(41.38879, 2.15899),    // Barcelona
      new LatLong(55.75222, 37.61556),   // Moscow
      new LatLong(30.0444,  31.2357),    // cairo
      new LatLong(-23.5505, -46.6333),   // Sao Paulo
      new LatLong(-1.2921,  36.8219),    // Nairobi
      new LatLong(6.5244, 3.3792),       // Lagos
      new LatLong(19.0760,  72.8777),    // Mumbai
      new LatLong(39.9042,  116.4074),   // Beijing
    ];
    for (const latlong of latlongs) {
      const newArticleInfo = { ...articleInfo };
      newArticleInfo.latlong = latlong;
      newArticleInfo.id = this.makeid(10);
      const article = new Article(newArticleInfo);
      this.locationGraph.addNode(article);
      this.globe.addArticle(article);
    }
    for (const node of this.locationGraph.nodes) {
      this.locationGraph.sortEdges(node);
    }
    console.log(this.locationGraph);
  }

  private makeid(length: number): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private getNearArticles(src: Article) {
    return this.locationGraph.getEdges(src).filter((edge) => {
      return edge.distance <= this.nearThreshold;
    });
  }

  private processRenderEvent(e: RenderEvent) {
    switch (e.type) {
      case EventType.Click: {
        this.hasSelectedArticle = true;
        this.selectedArticle = e.payload;
        const articles = this.getNearArticles(this.selectedArticle);
        this.nearArticles = articles.map((edge) => {
          return edge.dest as Article;
        });
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

  @HostListener('window:resize', ['$event'])
  public onResize(e: Event) {
    this.renderEvents.emitNewEvent({ type: EventType.Resize });
  }
}
