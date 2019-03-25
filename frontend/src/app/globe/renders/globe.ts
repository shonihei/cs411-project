import * as THREE from 'three';
import { LatLong } from './latlong';
import { Article } from './article';
import { OrbitControls } from 'three-orbitcontrols-ts';
import { MouseEmitterService } from '../../services/mouse-emitter.service';

export class Globe {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private controls: OrbitControls;

  public mesh: THREE.Mesh;

  readonly GLOBE_RADIUS = 200;

  public fieldOfView = 45;
  public nearClippingPane = 0.1;
  public farClippingPane = 10000;

  private intersectGlobe = false;

  private mouse: THREE.Vector2;

  constructor(readonly RADIUS: number, readonly SEGMENTS: number, readonly RINGS: number,
              readonly texture: THREE.Texture, readonly canvas: HTMLCanvasElement,
              private mouseEmitter: MouseEmitterService) {
    const sphereGeometry = new THREE.SphereGeometry(this.RADIUS, this.SEGMENTS, this.RINGS);
    const material = new THREE.MeshBasicMaterial({ map: this.texture });
    this.mesh = new THREE.Mesh(sphereGeometry, material);
    this.mesh.name = 'globe';
    this.animate = this.animate.bind(this);
    this.raycaster = new THREE.Raycaster();

    /* initializing mouse pos to (0, 0) will trigger the raycasting before a click
     * occurs and it will register an intersection if:
     * 1. globe is zoomed in
     * 2. client screen size is too small
     * so that the globe pixel fills the top left corner of the screen.
     *
     * To prevent this behavior, infinity is used to signal to render() that it
     * does not need to raycast
     */
    this.mouse = new THREE.Vector2(Infinity, Infinity);

    this.mouseEmitter.mouseCoord$.subscribe((coord) => {
      this.mouse.x = coord.x;
      this.mouse.y = coord.y;
    });
  }

  public init() {
    this.createCamera();
    this.createScene();
    this.addControls();
    this.startRendering();
  }

  private createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.add(this.mesh);
    this.scene.add(new THREE.AxesHelper(1000));
  }

  public addArticle(article: Article) {
    const latlongRad = article.latlongRad;
    const cartesianCoord = this.convertToCartesian(latlongRad);
    article.setPosition(cartesianCoord);
    article.lookAwayFrom(this.mesh);
    this.scene.add(article.mesh);
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

    if (this.validMousePosition()) {
      this.raycaster.setFromCamera(this.normalizedMouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children);
      // console.log(intersects.length);
      // console.log(this.mouse);
      if (intersects.length) {
        const firstIntersect = intersects[0].object;
        if (firstIntersect.name === this.mesh.name) {
          console.log('clicked on globe');
        } else if (firstIntersect.name === 'article') {
          console.log('clicked on an article');
        }
        // this.intersectGlobe = true;
      }
    }

    // } else if (intersects.length && intersects[0].object === this.article.mesh) {
    //   this.article.material.color.setHex(0xff0000);
    // } else {
    //   this.article.material.color.setHex(0xffffff);
    //   this.intersectGlobe = false;
    // }

    if (this.intersectGlobe) {
      // console.log('dragging');
    }

    this.renderer.render(this.scene, this.camera);
  }
}
