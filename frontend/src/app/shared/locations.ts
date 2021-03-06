import { Node } from './location-graph';

export class LatLong {
  constructor(public lat: number, public long: number) { }

  get latlongRad(): LatLong {
    return new LatLong(this.lat * (Math.PI / 180), -this.long * (Math.PI / 180));
  }

  get latLongDeg(): LatLong {
    return new LatLong(this.lat * (180 / Math.PI), -this.long * (180 / Math.PI));
  }
}

export class PlaceGN implements Node {
  constructor(public id: string, public name: string, public latlong: LatLong) { }
}
