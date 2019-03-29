import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  constructor(private http: HttpClient) { }

  getNews(query: string) {
    return this.http.get(`http://localhost:5000/articles?q=${query}`);
  }
}
