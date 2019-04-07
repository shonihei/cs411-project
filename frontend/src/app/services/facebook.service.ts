import { Injectable } from '@angular/core';
import { AuthService, SocialUser } from 'angularx-social-login';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { HometownResponse, TaggedPlacesResponse } from '../shared/facebook-api';
import { PlaceGN, LatLong } from '../shared/locations';

@Injectable({
  providedIn: 'root'
})
export class FacebookService {
  private user: SocialUser;
  private isLoggedIn = false;
  private rootUrl = 'https://graph.facebook.com/v3.2/';

  constructor(private oauthService: AuthService, private http: HttpClient) {
    this.oauthService.authState.subscribe((user) => {
      this.user = user;
      this.isLoggedIn = (user != null);
    });
  }

  private makeUrl(endpoint: string, params?: any) {
    if (!this.isLoggedIn) {
      return `${this.rootUrl}/${endpoint}`;
    }
    if (!params) {
      return `${this.rootUrl}/${endpoint}?access_token=${this.user.authToken}`;
    }
    let baseUrl = `${this.rootUrl}/${endpoint}?`;
    for (const paramName in params) {
      if (params.hasOwnProperty(paramName)) {
        baseUrl = `${baseUrl}${paramName}=${params[paramName]}&`;
      }
    }
    return `${baseUrl}access_token=${this.user.authToken}`;
  }

  getHometown() {
    return this.http
      .get<HometownResponse>(this.makeUrl('/me', { fields: 'hometown' }))
      .pipe(
        map((res) => {
          return res.hometown;
        })
      );
  }

  getPlaces() {
    return this.http
      .get<TaggedPlacesResponse>(this.makeUrl('/me/tagged_places', { limit: 100 }))
      .pipe(
        map((res) => {
          const places = res.data.map(placeTag => placeTag.place);
          const existingIds = new Set();
          return places.filter((place) => {
            if (!existingIds.has(place.id)) {
              existingIds.add(place.id);
              return true;
            }
            return false;
          });
        }),
        map((places) => {
          return places.map((place) => {
            return new PlaceGN(
              place.id, place.name, new LatLong(place.location.latitude, place.location.longitude)
            );
          });
        }));
  }
}
