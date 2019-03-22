import { Component } from '@angular/core';
import { NewsService } from './news.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'global-news';
  query = '';
  news: string[] = [];

  constructor(private newsService: NewsService) { }

  onSubmit() {
    console.log(`queried for ${this.query}`);
    this.getNews();
    console.log(`res: ${this.news}`);
  }

  getNews(): void {
    this.news = this.newsService.getNews(this.query);
  }
}
