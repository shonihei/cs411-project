import * as THREE from 'three';
import { LatLong } from './latlong';

export class Article {
  public mesh: THREE.Mesh;
  public material: THREE.MeshBasicMaterial;
  private geometry: THREE.CircleGeometry;

  constructor(readonly latlong: LatLong) {
    this.geometry = new THREE.CircleGeometry(7, 32);
    this.material = new THREE.MeshBasicMaterial({ color: 0xf9a825 });
    this.material.opacity = 0.5;
    this.material.transparent = true;
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = 'article';
  }

  public get latlongRad(): LatLong {
    return {
      lat: this.latlong.lat * (Math.PI / 180),
      long: -this.latlong.long * (Math.PI / 180)
    };
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
