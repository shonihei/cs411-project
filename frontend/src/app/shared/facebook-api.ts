export interface HometownResponse {
  id?: string;
  hometown?: Hometown;
}

export interface Hometown {
  id?: string;
  name?: string;
}

export interface Location {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  state?: string;
  street?: string;
  zip?: string;
}

export interface Place {
  id?: string;
  location?: Location;
  name: string;
}

export interface PlaceTag {
  id?: string;
  created_time?: string;
  place?: Place;
}

export interface Cursors {
  after?: string;
  before?: string;
}

export interface Paging {
  cursors?: Cursors;
  previous?: string;
  next?: string;
}

export interface TaggedPlacesResponse {
  data?: PlaceTag[];
  paging?: Paging;
}
