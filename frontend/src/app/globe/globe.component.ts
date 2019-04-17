import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { TextureLoaderService } from '../services/texture-loader.service';
import { Globe } from './renders/globe';
import { Article, ArticleNode } from './renders/article';
import { MouseEmitterService } from '../services/mouse-emitter.service';
import { RenderEventsService, EventType, RenderEvent } from '../services/render-events.service';
import { Vector2, Texture } from 'three';
import { Subject, ReplaySubject, Observable, timer } from 'rxjs';
import { LocationGraph } from '../shared/location-graph';
import { LatLong, PlaceGN } from '../shared/locations';
import { AuthService } from 'angularx-social-login';
import { FacebookService } from '../services/facebook.service';
import { NewsService } from '../services/news.service';
import { ArticleResponse } from '../shared/article-api';

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
  private articlesByFetch = {};
  private nearThreshold = 500; // anything within 500km is considered "near"
  private nearArticles: Article[] = [];
  private locationGraph = new LocationGraph();

  private isLoggedIn: boolean;

  private initializedSignal = new ReplaySubject(1);
  private initializedSignal$ = this.initializedSignal.asObservable();

  readonly articleFetchingInterval = 5 * 60 * 1000; // 5 minutes
  readonly numArticles = 25;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  constructor(private textureLoaderService: TextureLoaderService,
              private mouseEmitter: MouseEmitterService,
              private renderEvents: RenderEventsService,
              private authService: AuthService,
              private facebookService: FacebookService,
              private newsService: NewsService) { }

  ngOnInit() {
    this.resetSelection$.subscribe(() => this.clearSelection());
    this.renderEvents.events$.subscribe(e => this.processRenderEvent(e));
    this.initializedSignal$.subscribe(() => {
      timer(0, this.articleFetchingInterval).subscribe((val) => {
        this.articlesByFetch[val] = [] as Article[];
        this.newsService.getNews(this.numArticles).subscribe((res: ArticleResponse) => {
          for (const articleInfo of res.articles) {
            const article = new Article(articleInfo);
            this.globe.addArticle(article);
            this.articlesByFetch[val].push(article);
            this.locationGraph.addNode(article);
          }

          if (this.isLoggedIn) {
            this.addNearPlaces();
          }

          // remove articles added to the globe 2 fetches ago
          if (val > 1) {
            for (const article of this.articlesByFetch[val - 2]) {
              this.globe.removeArticle(article);
              this.locationGraph.removeNode(article);
            }
            delete this.articlesByFetch[val - 2];
          }
        });
      });
    });
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
    for (const fetch in this.articlesByFetch) {
      if (this.articlesByFetch.hasOwnProperty(fetch)) {
        for (const article of this.articlesByFetch[fetch]) {
          const nearPlaces = this.getNearPlaces(article);
          if (nearPlaces.length && !article.hasNearPlace()) {
            article.addNearLocation(nearPlaces[0]);
          }
        }
      }
    }
  }

  private removeNearPlace() {
    for (const fetch in this.articlesByFetch) {
      if (this.articlesByFetch.hasOwnProperty(fetch)) {
        for (const article of this.articlesByFetch[fetch]) {
          const nearPlaces = this.getNearPlaces(article);
          if (nearPlaces.length) {
            article.removeNearLocation();
          }
        }
      }
    }
    this.locationGraph.removeNodesOfType('PlaceGN');
  }

  private initializeRender(texture: Texture) {
    this.globe = new Globe(this.GLOBE_RADIUS, 50, 50, texture, this.canvas,
                           this.mouseEmitter, this.renderEvents);
    this.globe.init();
    this.initializedSignal.next(true);
    this.initializedSignal.complete();
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
