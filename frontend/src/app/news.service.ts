import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  constructor() { }

  getNews(query: string): string[] {
    return [
      'bears',
      'beets',
      'battlestar galactica',
    ];
  }
}
