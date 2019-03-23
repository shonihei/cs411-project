import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Coordinate } from './coordinate';
import * as THREE from "three";
import { Raycaster, Vector2 } from 'three';
// import * as p5 from "p5";

export class MousePosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-globe',
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.sass']
})
export class GlobeComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') canvasRef: ElementRef;
  // private sketch: p5;
  // private earthTexture: p5.Image;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private cameraTarget: THREE.Vector3;
  public scene: THREE.Scene;
  private texture: THREE.Texture;
  private globe: THREE.Group;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  public fieldOfView: number = 45;
  public nearClippingPane: number = 0.1;
  public farClippingPane: number = 10000;
  private lastPosition: MousePosition = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }

  constructor() {
    this.render = this.render.bind(this);
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.createCamera();
    this.createScene();
  }

  public onClick(e: MouseEvent) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
    console.log(this.mouse);
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    const RADIUS = 200;
    const SEGMENTS = 50;
    const RINGS = 50;
    this.globe = new THREE.Group();
    this.scene.add(this.globe);
    var loader = new THREE.TextureLoader();
    var self = this;
    loader.load('../assets/img/earthDark.jpg', function (texture) {
      console.log("success");
      var sphere = new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS);
      var material = new THREE.MeshBasicMaterial({ map: texture });
      var mesh = new THREE.Mesh(sphere, material);
      self.globe.add(mesh);
      self.globe.position.z = -300;

      self.camera.lookAt(self.globe.position);
      self.startRendering();
    });
  }

  private createCamera() {
    let aspectRatio = this.getAspectRatio();
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      aspectRatio,
      this.nearClippingPane,
      this.farClippingPane
    );

    // Set position and look at
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 500;
  }

  private getAspectRatio(): number {
    let height = this.canvas.clientHeight;
    if (height === 0) {
      return 0;
    }
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  private startRendering() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.autoClear = true;

    this.render();
  }

  private test = true;

  public render() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (this.test) {
      this.test = false;
      for (let object of intersects) {
        console.log(object);
      }
    }

    requestAnimationFrame(this.render);
    this.globe.rotation.y -= 0.005;
    this.renderer.render(this.scene, this.camera);
  }
}
