import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Vector2 } from 'three';

@Injectable({
  providedIn: 'root'
})
export class MouseEmitterService {
  private mouseSource = new BehaviorSubject(new Vector2(Infinity, Infinity));
  mouseCoord$ = this.mouseSource.asObservable();

  constructor() { }

  updateMouseCoord(coord: Vector2) {
    this.mouseSource.next(coord);
  }
}
