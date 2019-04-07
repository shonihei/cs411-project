import * as THREE from 'three';
import { LatLong } from '../../shared/locations';
import { Article } from './article';
import { OrbitControls } from 'three-orbitcontrols-ts';
import { MouseEmitterService } from '../../services/mouse-emitter.service';
import { RenderEventsService, EventType } from 'src/app/services/render-events.service';

class ArticleMap {
  [index: string]: Article;
}

export class Globe {

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
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private controls: OrbitControls;
  private animationGroup: THREE.AnimationObjectGroup;
  private clock: THREE.Clock;
  private animationMixer: THREE.AnimationMixer;

  public mesh: THREE.Mesh;

  private fieldOfView = 45;
  private nearClippingPane = 0.1;
  private farClippingPane = 10000;

  private maxRotateSpeed = 0.6;
  private minRotateSpeed = 0;
  private maxDistance = 800;
  private minDistance = 400;

  private mouse: THREE.Vector2;
  private clicked = false;

  private articles: Article[] = [];
  private articleMap = new ArticleMap();

  private selector: THREE.Mesh;

  private selectorAnimationMixer: THREE.AnimationMixer;
  private selectorClipAction: THREE.AnimationAction;

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
    this.createSelector();
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

  private createSelector() {
    const shape = this.makeRectangle(0, 0, 50, 15, 1.5);
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.center();
    const material = new THREE.MeshBasicMaterial({ color: 0x2375fa, transparent: true });

    this.selector = new THREE.Mesh(geometry, material);
    this.selector.visible = false;
    this.scene.add(this.selector);

    const opacityKF =
      new THREE.NumberKeyframeTrack('.material.opacity',
                                    [0, 0.1, 0.2], [0, 0.7, 0]);
    const clip = new THREE.AnimationClip('default', 0.3, [opacityKF]);
    this.selectorAnimationMixer = new THREE.AnimationMixer(this.selector);
    this.selectorAnimationMixer.addEventListener('finished', (e) => {
      this.selector.visible = false;
    });
    this.selectorClipAction = this.selectorAnimationMixer.clipAction(clip);
    this.selectorClipAction.setLoop(THREE.LoopOnce, 1);
  }

  /**
   * Creates a rounded rectangle.
   * @param x x offset
   * @param y y offset
   * @param width width of the rectangle
   * @param height height of the rectangle
   * @param radius radius on the corner (rounded corners)
   */
  private makeRectangle(x: number, y: number, width: number,
                        height: number, radius: number): THREE.Shape {
    const shape = new THREE.Shape();
    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);
    return shape;
  }

  public addArticle(article: Article) {
    article.initialize();
    article.readySignal$.subscribe(() => {
      const latlongRad = article.latlong.latlongRad;
      const cartesianCoord = this.convertToCartesian(latlongRad);
      article.setPosition(cartesianCoord);
      article.lookAwayFrom(this.mesh);
      article.addToScene(this.scene);

      article.addToAnimationGroup(this.animationGroup);
      this.articles.push(article);
      this.articleMap[article.meshId] = article;
    });
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
    this.camera.position.z = this.maxDistance;
  }

  private addControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enablePan = false;
    this.controls.minDistance = this.minDistance;
    this.controls.maxDistance = this.maxDistance;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = this.maxRotateSpeed;

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

  private updateArticleRotation() {
    this.selector.lookAt(this.camera.position);
    for (const article of this.articles) {
      article.lookAt(this.camera);
    }
  }

  /**
   * Updates the rotation speed depending on how close the camera is
   * to the globe.
   * The closer the camera, the slower the globe spins
   */
  private updateAutoRotateSpeed() {
    const dist = this.camera.position.distanceTo(this.mesh.position);
    // re-maps the distance from the camera to the globe to minRotateSpeed
    // to maxRotateSpeed
    this.controls.autoRotateSpeed =
      ((dist - this.minDistance) / (this.maxDistance - this.minDistance)) *
      (this.maxRotateSpeed - this.minRotateSpeed) + this.minRotateSpeed;
  }

  private animate() {
    requestAnimationFrame(this.animate);
    this.render();
  }

  private render() {
    this.updateAutoRotateSpeed();
    this.controls.update();
    this.updateArticleRotation();
    this.updateAnimationKeyFrame();

    if (this.validMousePosition()) {
      this.checkIntersection();
    } else {
      this.clicked = false;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updateAnimationKeyFrame() {
    const delta = this.clock.getDelta();
    if (this.animationMixer) {
      this.animationMixer.update(delta);
    }
    if (this.selectorAnimationMixer) {
      this.selectorAnimationMixer.update(delta);
    }
  }

  private checkIntersection() {
    this.raycaster.setFromCamera(this.normalizedMouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length && !this.clicked) {
      this.clicked = true;
      const firstIntersect = intersects[0].object;
      if (firstIntersect.parent.name === 'article') {
        const article = firstIntersect.parent;
        const articleBox = article.getObjectByName('article-box');
        this.showSelector(articleBox);
        this.renderEvents.emitNewEvent(
          {
            type: EventType.Click,
            target: article,
            payload: this.articleMap[article.id]
          }
        );
      }
    }
  }

  private showSelector(articleBox: THREE.Object3D) {
    const articleBoxPos = new THREE.Vector3();
    articleBox.getWorldPosition(articleBoxPos);
    this.selector.position.copy(articleBoxPos);
    this.selector.visible = true;
    this.selectorClipAction.stop();
    this.selectorClipAction.play();
  }
}
