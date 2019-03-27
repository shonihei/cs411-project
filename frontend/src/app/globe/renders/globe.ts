import * as THREE from 'three';
import { LatLong } from './latlong';
import { Article } from './article';
import { OrbitControls } from 'three-orbitcontrols-ts';
import { MouseEmitterService } from '../../services/mouse-emitter.service';
import { RenderEventsService, EventType } from 'src/app/services/render-events.service';

export class Globe {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private controls: OrbitControls;
  private animationGroup: THREE.AnimationObjectGroup;
  private clock: THREE.Clock;
  private animationMixer: THREE.AnimationMixer;

  public mesh: THREE.Mesh;

  public fieldOfView = 45;
  public nearClippingPane = 0.1;
  public farClippingPane = 10000;

  private mouse: THREE.Vector2;

  constructor(readonly RADIUS: number, readonly SEGMENTS: number, readonly RINGS: number,
              readonly texture: THREE.Texture, readonly canvas: HTMLCanvasElement,
              private mouseEmitter: MouseEmitterService,
              private renderEvents: RenderEventsService) {
    // mouse coordinate of infinity is used to signal that there's no mouse activity
    this.mouse = new THREE.Vector2(Infinity, Infinity);
    this.mouseEmitter.mouseCoord$.subscribe((coord) => {
      this.mouse.x = coord.x;
      this.mouse.y = coord.y;
    });
    this.renderEvents.events$.subscribe((e) => {
      if (e.type === EventType.Resize) {
        this.onResize();
      }
    });

    this.animate = this.animate.bind(this);
  }

  private onResize() {
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.camera.aspect = this.aspectRatio;
    this.camera.updateProjectionMatrix();
  }

  public init() {
    this.initializeGlobe();
    this.initializeArticleAnimation();

    this.createCamera();
    this.createScene();
    this.addControls();
    this.startRendering();
  }

  private initializeGlobe() {
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();

    const sphereGeometry = new THREE.SphereGeometry(this.RADIUS, this.SEGMENTS, this.RINGS);
    const material = new THREE.MeshBasicMaterial({ map: this.texture });
    this.mesh = new THREE.Mesh(sphereGeometry, material);
    this.mesh.name = 'globe';
  }

  private initializeArticleAnimation() {
    this.animationGroup = new THREE.AnimationObjectGroup();
    const opacityKF = new THREE.NumberKeyframeTrack('.material.opacity', [0, 1, 2], [1, 0.5, 0]);
    const scaleKF =
      new THREE.VectorKeyframeTrack('.scale', [0, 1, 2], [0, 0, 0, 0.75, 0.75, 0.75, 1, 1, 1]);
    const clip = new THREE.AnimationClip('default', 3, [opacityKF, scaleKF]);
    this.animationMixer = new THREE.AnimationMixer(this.animationGroup);
    const clipAction = this.animationMixer.clipAction(clip);
    clipAction.play();
  }

  private createScene() {
    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
  }

  public addArticle(article: Article) {
    const latlongRad = article.latlongRad;
    const cartesianCoord = this.convertToCartesian(latlongRad);
    article.setPosition(cartesianCoord);
    article.lookAwayFrom(this.mesh);
    this.scene.add(article.mesh);

    this.animationGroup.add(article.mesh);
  }

  /**
   * converts geographic coordinate (in radians) to 3-dimensional cartesian coordinate
   * @param latlong latitude and longitude in radians
   */
  private convertToCartesian(latlong: LatLong): THREE.Vector3 {
    return new THREE.Vector3(
      Math.cos(latlong.lat) * Math.cos(latlong.long) * this.RADIUS,
      Math.sin(latlong.lat) * this.RADIUS,
      Math.cos(latlong.lat) * Math.sin(latlong.long) * this.RADIUS
    );
  }

  /**
   * normalizes current mouse coordinate to -1, 1 on x, y
   */
  private get normalizedMouse(): THREE.Vector2 {
    return new THREE.Vector2(
      (this.mouse.x / window.innerWidth) * 2 - 1,
      -(this.mouse.y / window.innerHeight) * 2 + 1
    );
  }

  private get aspectRatio(): number {
    const height = this.canvas.clientHeight;
    if (height === 0) {
      return 0;
    }
    return this.canvas.clientWidth / this.canvas.clientHeight;
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

  private addControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
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
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setClearColor(0xffffff, 0);

    this.animate();
  }

  private validMousePosition() {
    return this.mouse.x !== Infinity && this.mouse.y !== Infinity;
  }

  private animate() {
    requestAnimationFrame(this.animate);
    this.render();
  }

  private render() {
    this.controls.update();

    const delta = this.clock.getDelta();
    if (this.animationMixer) {
      this.animationMixer.update(delta);
    }

    if (this.validMousePosition()) {
      this.checkIntersection();
    }

    this.renderer.render(this.scene, this.camera);
  }

  private checkIntersection() {
    this.raycaster.setFromCamera(this.normalizedMouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    if (intersects.length) {
      const firstIntersect = intersects[0].object;
      if (firstIntersect.name === 'article') {
        this.renderEvents.emitNewEvent({ type: EventType.Click, target: firstIntersect });
      }
    }
  }
}
