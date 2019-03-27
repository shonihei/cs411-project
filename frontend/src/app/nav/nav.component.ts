import { Component, OnInit } from '@angular/core';
import { NewsService } from '../news.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.sass']
})
export class NavComponent implements OnInit {
  query = '';
  news: string[] = [];

  constructor(private newsService: NewsService) { }

  ngOnInit() { }

  onSubmit() {
    console.log(`queried for ${this.query}`);
    this.getNews();
    console.log(`res: ${this.news}`);
  }

  getNews(): void {
    this.news = this.newsService.getNews(this.query);
  }
}
