import * as THREE from 'three';
import { LatLong } from './latlong';

export class Article {
  private meshGroup: THREE.Group;
  public pulseMesh: THREE.Mesh;
  private boxMesh: THREE.Mesh;

  constructor(readonly latlong: LatLong) {
    this.meshGroup = new THREE.Group();
    this.meshGroup.name = 'article';

    this.createPulse();
    this.createArticleBox();
    this.createConnection();
  }

  private createPulse() {
    const geometry = new THREE.CircleGeometry(7, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xfc2f2f });
    material.opacity = 0.5;
    material.transparent = true;
    this.pulseMesh = new THREE.Mesh(geometry, material);
    this.meshGroup.add(this.pulseMesh);
  }

  private createArticleBox() {
    const boxG = new THREE.BoxGeometry(50, 20, 2);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.boxMesh = new THREE.Mesh(boxG, boxMat);
    // add border to article box
    const geo = new THREE.EdgesGeometry(this.boxMesh.geometry);
    const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    const wireframe = new THREE.LineSegments(geo, mat);
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
    this.boxMesh.add(wireframe);

    // if the location is in the southern hemisphere, translate negatively
    if (this.latlong.lat < 0) {
      this.boxMesh.translateY(-10);
    } else {
      this.boxMesh.translateY(10);
    }
    this.boxMesh.translateZ(20);
    this.meshGroup.add(this.boxMesh);
  }

  private createConnection() {
    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const lineGeo = new THREE.Geometry();
    lineGeo.vertices.push(this.pulseMesh.position);
    lineGeo.vertices.push(this.boxMesh.position);
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
}
