import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as THREE from 'three';

export enum EventType {
  Null,
  Click,
  Resize,
}


export interface RenderEvent {
  type: EventType;
  target?: THREE.Object3D;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class RenderEventsService {
  private eventSource = new BehaviorSubject({ type: EventType.Null } as RenderEvent);
  events$ = this.eventSource.asObservable();

  constructor() { }

  emitNewEvent(event: RenderEvent) {
    this.eventSource.next(event);
  }
}
