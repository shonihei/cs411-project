import * as THREE from 'three';
import { LatLong } from './latlong';
import { Subject } from 'rxjs';

export interface ArticleInfo {
  source?: string;
  author?: string;
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt?: string;
  content?: string;
  latlong: LatLong;
}

export class Article {
  public readySignal$ = new Subject();

  private meshGroup: THREE.Group;
  public pulseMesh: THREE.Mesh;
  private boxMesh: THREE.Mesh;
  private info: ArticleInfo;
  private image: HTMLImageElement;

  private textureWidth = 256;
  private textureHeight = 128;
  // length of article description in each line
  private descrLineLength = 180;
  private descrnumLines = 4;
  // length of article title
  private articleLineLength = 230;

  private articleDescription =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \
  Curabitur eleifend bibendum molestie. Suspendisse et luctus \
  dolor. Nam ut ante in quam euismod ultrices. Suspendisse molestie \
  ipsum ut neque vulputate, ultrices lacinia turpis interdum. Aliquam \
  vitae pulvinar elit. Curabitur dignissim elementum aliquet. Curabitur \
  tincidunt purus et sem luctus tincidunt. Aliquam fermentum.';
  private articleTitle = 'Something about bitcoins and machine learning';

  constructor(readonly latlong: LatLong) {
    this.meshGroup = new THREE.Group();
    this.meshGroup.name = 'article';

    this.loadImage('../../assets/img/shiba.jpg').subscribe((img) => {
      this.image = img;
      this.createPulse();
      this.createArticleBox();
      this.createConnection();
      this.notifyReady();
    });
  }

  /**
   * Notifies to subscribers that the article is ready to be loaded
   * into a scene
   */
  private notifyReady() {
    this.readySignal$.next();
    this.readySignal$.complete();
  }

  private createPulse() {
    const geometry = new THREE.CircleGeometry(7, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xfc2f2f });
    material.transparent = true;
    this.pulseMesh = new THREE.Mesh(geometry, material);
    this.meshGroup.add(this.pulseMesh);
  }

  /**
   * Dynamically creates texture that includes article title, description
   * source and image.
   */
  private createTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.textureWidth;
    canvas.height = this.textureHeight;

    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, this.textureWidth, this.textureHeight);
    this.writeTitle(context);
    this.writeDescription(context);

    context.drawImage(this.image, 0, 0, this.image.width, this.image.height, 200, 33, 50, 50);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(0.02, 0.044);   // magic number: don't ask me how i got it
    texture.offset.set(-0.0005, 0.13); // magic number: don't ask me how i got it
    return texture;
  }

  /**
   * Writes title of the article in canvas text
   * @param context canvas context
   */
  private writeTitle(context: CanvasRenderingContext2D) {
    context.font = '300 14px Roboto';
    context.fillStyle = '#000000';
    const lineBreaks = this.calculateLineBreaks(this.articleTitle, this.articleLineLength, context);
    if (lineBreaks.length === 1) {
      context.fillText(lineBreaks[0], 10, 20);
    } else {
      context.fillText(`${lineBreaks[0]}...`, 10, 20);
    }
  }

  /**
   * Writes description of the article in canvas text
   */
  private writeDescription(context: CanvasRenderingContext2D) {
    context.font = '10px Roboto';
    context.fillStyle = '#545454';
    const lineBreaks = this.calculateLineBreaks(this.articleDescription,
                                                this.descrLineLength, context);
    let startAt = 40;
    for (const line of lineBreaks.slice(0, this.descrnumLines - 1)) {
      context.fillText(line, 10, startAt);
      startAt += 15;
    }
    if (lineBreaks.length > this.descrnumLines) {
      context.fillText(`${lineBreaks[this.descrnumLines - 1]}...`, 10, startAt);
    } else {
      context.fillText(lineBreaks[this.descrnumLines - 1], 10, startAt);
    }
  }

  /**
   * Creates 2D shape container where article content will be rendered to.
   */
  private createArticleBox() {
    const shape = this.makeRectangle(0, 0, 50, 20, 1.5);
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.center();

    // texture contains information about the article (title, description, etc...)
    const texture = this.createTexture();
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture });

    this.boxMesh = new THREE.Mesh(geometry, material);
    this.translateArticleBox();

    // add border line to article box
    const edges = new THREE.EdgesGeometry(geometry);
    const border = new THREE.LineSegments(edges,
                                          new THREE.LineBasicMaterial({ color: 0x444444 }));
    this.boxMesh.add(border);

    this.meshGroup.add(this.boxMesh);
  }

  /**
   * Moves the article box away from the globe.
   */
  private translateArticleBox() {
    // if the location is in the southern hemisphere, translate negatively
    if (this.latlong.lat < 0) {
      this.boxMesh.translateY(-10);
    } else {
      this.boxMesh.translateY(10);
    }
    this.boxMesh.translateZ(20);
  }

  /**
   * Returns an observable that contains the loaded image
   * @param url url of the image
   */
  private loadImage(url: string): Subject<HTMLImageElement> {
    const img = new Image();
    img.src = url;
    const obs = new Subject<HTMLImageElement>();
    img.onload = () => {
      obs.next(img);
      obs.complete();
    };
    img.onerror = (e) => {
      obs.error(e);
    };
    return obs;
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

  /**
   * Creates a simple line that connects the pulse and the article box.
   */
  private createConnection() {
    const lineMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    const lineGeo = new THREE.Geometry();
    lineGeo.vertices.push(this.pulseMesh.position);
    lineGeo.vertices.push(
      new THREE.Vector3(
        this.boxMesh.position.x,
        this.boxMesh.position.y,
        this.boxMesh.position.z - 5 // offset by 5 units so that it won't intersect with box
      )
    );
    const line = new THREE.Line(lineGeo, lineMat);
    this.meshGroup.add(line);
  }

  public get latlongRad(): LatLong {
    return {
      lat: this.latlong.lat * (Math.PI / 180),
      long: -this.latlong.long * (Math.PI / 180)
    };
  }

  public setPosition(pos: THREE.Vector3) {
    this.meshGroup.position.set(pos.x, pos.y, pos.z);
  }

  public lookAwayFrom(target: THREE.Mesh) {
    const v = new THREE.Vector3();
    v.subVectors(this.meshGroup.position, target.position).add(this.meshGroup.position);
    this.meshGroup.lookAt(v);
  }

  public lookAt(target: THREE.Object3D) {
    this.boxMesh.lookAt(target.position);
  }

  public addToAnimationGroup(ag: THREE.AnimationObjectGroup) {
    ag.add(this.pulseMesh);
  }

  public addToScene(scene: THREE.Scene) {
    scene.add(this.meshGroup);
  }

  /**
   * Breaks up a long string so that each line is no longer than maxWidth
   * @param text original string
   * @param context canvas context
   */
  private calculateLineBreaks(text: string, maxWidth: number,
                              context: CanvasRenderingContext2D): string[] {
    const output: string[] = [];
    let buffer = '';
    let textWidth = 0;
    for (const word of text.split(' ')) {
      const wordWidth = context.measureText(word).width;
      if (textWidth + wordWidth > maxWidth) {
        output.push(buffer.trim());
        buffer = `${word} `;
      } else {
        buffer += `${word} `;
      }
      textWidth = context.measureText(buffer).width;
    }
    if (buffer !== output[output.length - 1]) {
      output.push(buffer.trim());
    }
    return output;
  }
}