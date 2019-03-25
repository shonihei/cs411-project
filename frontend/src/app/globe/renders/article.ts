import * as THREE from 'three';
import { LatLong } from './latlong';

export class Article {
  public mesh: THREE.Mesh;
  public material: THREE.MeshBasicMaterial;
  private geometry: THREE.CircleGeometry;

  constructor(readonly latlong: LatLong) {
    this.geometry = new THREE.CircleGeometry(5, 32);
    this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = 'article';
    // this.mesh.add(new THREE.AxesHelper(100));
  }

  public get latlongRad(): LatLong {
    return new LatLong(
      this.latlong.lat * (Math.PI / 180),
      -this.latlong.long * (Math.PI / 180)
    );
  }

  public setPosition(pos: THREE.Vector3) {
    this.mesh.position.set(pos.x, pos.y, pos.z);
  }

  public lookAwayFrom(target: THREE.Mesh) {
    const v = new THREE.Vector3();
    v.subVectors(this.mesh.position, target.position).add(this.mesh.position);
    this.mesh.lookAt(v);
  }
}
