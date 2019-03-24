import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import { Raycaster, Vector2 } from 'three';
import { OrbitControls } from 'three-orbitcontrols-ts';
import { TextureLoaderService } from '../services/texture-loader.service';
import { Article, Globe } from './objects';

@Component({
  selector: 'app-globe',
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.sass']
})
export class GlobeComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') canvasRef: ElementRef;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private texture: THREE.Texture;
  private raycaster: THREE.Raycaster;
  private controls: OrbitControls;

  private globe: Globe;
  readonly GLOBE_RADIUS = 200;

  private article: Article;

  private intersectGlobe = false;

  public fieldOfView = 45;
  public nearClippingPane = 0.1;
  public farClippingPane = 10000;

  private mouse: THREE.Vector2;

  private get normalizedMouse(): THREE.Vector2 {
    return new THREE.Vector2(
      (this.mouse.x / window.innerWidth) * 2 - 1,
      -(this.mouse.y / window.innerHeight) * 2 + 1
    );
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private get aspectRatio(): number {
    const height = this.canvas.clientHeight;
    if (height === 0) {
      return 0;
    }
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  constructor(private textureLoaderService: TextureLoaderService) {
    this.render = this.render.bind(this);
    this.raycaster = new Raycaster();
    this.mouse = new Vector2(0, 0);
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.textureLoaderService
      .getTexture('../assets/img/earthDark.jpg')
      .subscribe(texture => {
        this.texture = texture;
        this.createCamera();
        this.createScene();
        this.addControls();
        this.startRendering();
      });
  }

  private createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      this.aspectRatio,
      this.nearClippingPane,
      this.farClippingPane
    );

    // Set position and look at
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 800;
  }

  private createScene() {
    const SEGMENTS = 50;
    const RINGS = 50;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.globe = new Globe(this.GLOBE_RADIUS, SEGMENTS, RINGS, this.texture, this.scene);
    this.globe.addToScene();

    // adding article as a demo
    const articles = [
      new Article({ lat: 40.7128, long: -74.0060 }),   // New York
      new Article({ lat: 35.6895, long: 139.69171 }),  // tokyo
      new Article({ lat: 34.69374, long: 135.50218 }), // osaka
      new Article({ lat: 30.79186, long: -83.78989 }), // Boston
      new Article({ lat: 47.60621, long: -122.33207 }),// seattle
      new Article({ lat: 34.05223, long: -118.24368 }),// LA
      new Article({ lat: 51.50853, long: -0.12574 }),  // London
      new Article({ lat: 41.38879, long: 2.15899 }),   // Barcelona
      new Article({ lat: 55.75222, long: 37.61556 }),  // Moscow
      new Article({ lat: 30.0444, long: 31.2357}),     // cairo
      new Article({ lat: -23.5505, long: -46.6333}),   // Sao Paulo
      new Article({ lat: -1.2921, long: 36.8219}),     // Nairobi
      new Article({ lat: 6.5244, long: 3.3792}),       // Lagos
      new Article({ lat: 19.0760, long: 72.8777}),     // Mumbai
      new Article({ lat: 39.9042, long: 116.4074}),    // Beijing
    ]
    for (const article of articles) {
      this.globe.addArticle(article);
    }
  }

  private addControls() {
    this.controls = new OrbitControls(this.camera);
    this.controls.rotateSpeed = 0.5;
    this.controls.enablePan = false;
    this.controls.minDistance = 400;
    this.controls.maxDistance = 800;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = -0.5;

    // fixes vertical orbit to 45 degrees
    this.controls.minPolarAngle = 45 * Math.PI / 180;
    this.controls.maxPolarAngle = 135 * Math.PI / 180;
  }

  private startRendering() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    this.render();
  }

  private render() {

    this.controls.update();

    this.raycaster.setFromCamera(this.normalizedMouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    if (intersects.length && intersects[0].object === this.globe.mesh) {
      this.intersectGlobe = true;
      // this.article.material.color.setHex(0xffffff);
    } //else if (intersects.length && intersects[0].object === this.article.mesh) {
    //   this.article.material.color.setHex(0xff0000);
    // } else {
    //   this.article.material.color.setHex(0xffffff);
    //   this.intersectGlobe = false;
    // }

    if (this.intersectGlobe) {
      // console.log('dragging');
    }

    requestAnimationFrame(this.render);
    this.renderer.render(this.scene, this.camera);
  }

  public onClick(e: MouseEvent) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }
}
