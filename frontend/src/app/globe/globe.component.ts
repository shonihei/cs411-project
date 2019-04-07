import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { TextureLoaderService } from '../services/texture-loader.service';
import { Globe } from './renders/globe';
import { Article, ArticleInfo } from './renders/article';
import { MouseEmitterService } from '../services/mouse-emitter.service';
import { RenderEventsService, EventType, RenderEvent } from '../services/render-events.service';
import { Vector2, Texture } from 'three';
import { Subject, ReplaySubject } from 'rxjs';
import { LocationGraph } from '../shared/location-graph';
import { LatLong, PlaceGN } from '../shared/locations';
import { AuthService } from 'angularx-social-login';
import { FacebookService } from '../services/facebook.service';

@Component({
  selector: 'app-globe',
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.sass']
})
export class GlobeComponent implements OnInit {
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

  private articles: Article[] = [];
  private nearThreshold = 500; // anything within 500km is considered "near"
  private nearArticles: Article[] = [];
  private locationGraph = new LocationGraph();

  private isLoggedIn: boolean;

  private initializedSignal = new ReplaySubject(1);
  private initializedSignal$ = this.initializedSignal.asObservable();

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  constructor(private textureLoaderService: TextureLoaderService,
              private mouseEmitter: MouseEmitterService,
              private renderEvents: RenderEventsService,
              private authService: AuthService,
              private facebookService: FacebookService) { }

  ngOnInit() {
    this.resetSelection$.subscribe(() => this.clearSelection());
    this.renderEvents.events$.subscribe(e => this.processRenderEvent(e));
    this.textureLoaderService
      .getTexture('../assets/img/earthBlueHD.png')
      .subscribe(texture => this.initializeRender(texture));
    this.authService.authState.subscribe((user) => {
      this.isLoggedIn = (user != null);
      if (this.isLoggedIn) {
        this.facebookService.getPlaces().subscribe((places) => {
          places.forEach(place => this.locationGraph.addNode(place));
          this.initializedSignal$.subscribe(() => this.addNearPlaces());
        });
      } else {
        this.removeNearPlace();
      }
    });
  }

  private clearSelection() {
    this.hasSelectedArticle = false;
    this.selectedArticle = null;
    this.mouseEmitter.updateMouseCoord(new Vector2(Infinity, Infinity));
  }

  private addNearPlaces() {
    for (const article of this.articles) {
      const nearPlaces = this.getNearPlaces(article);
      if (nearPlaces.length) {
        article.addNearLocation(nearPlaces[0]);
      }
    }
  }

  private removeNearPlace() {
    for (const article of this.articles) {
      const nearPlaces = this.getNearPlaces(article);
      if (nearPlaces.length) {
        article.removeNearLocation();
      }
    }
    this.locationGraph.removeNodesOfType('PlaceGN');
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
      this.globe.addArticle(article);
      this.articles.push(article);
      this.locationGraph.addNode(article);
    }
    for (const node of this.locationGraph.nodes) {
      this.locationGraph.sortEdges(node);
    }
    this.initializedSignal.next(true);
    this.initializedSignal.complete();
  }

  /**
   * generates a random char
   * REMOVE ONCE WE HAVE LIVE DATA
   * @param length number indicating the length of random chars
   */
  private makeid(length: number): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private getNearPlaces(src: Article) {
    this.locationGraph.sortEdges(src);
    return this.locationGraph
      .getEdges(src)
      .filter(
        edge => edge.dest.constructor.name === 'PlaceGN' && edge.distance <= this.nearThreshold
      )
      .map(edge => edge.dest as PlaceGN);
  }

  private getNearArticles(src: Article) {
    this.locationGraph.sortEdges(src);
    return this.locationGraph
      .getEdges(src)
      .filter(edge =>
        edge.dest.constructor.name === 'Article' && edge.distance <= this.nearThreshold
      )
      .map(edge => edge.dest as Article);
  }

  private processRenderEvent(e: RenderEvent) {
    switch (e.type) {
      case EventType.Click: {
        this.hasSelectedArticle = true;
        this.selectedArticle = e.payload;
        this.nearArticles = this.getNearArticles(this.selectedArticle);
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
