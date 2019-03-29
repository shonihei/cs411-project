import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { bindCallback, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TextureLoaderService {
  getTexture(url: string): Observable<THREE.Texture> {
    const loader = new THREE.TextureLoader();
    return bindCallback(loader.load).call(loader, url);
  }
}
