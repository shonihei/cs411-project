import { Component, OnInit } from '@angular/core';
import { NewsService } from '../services/news.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.sass']
})
export class NavComponent implements OnInit {
  query = '';
  res: {};
  hasRes = false;

  constructor(private news: NewsService) { }

  ngOnInit() { }

  onSubmit() {
    console.log(`queried for ${this.query}`);
    this.getNews();
  }

  getNews(): void {
    this.news.getNews(this.query).subscribe((res) => {
      this.res = res;
      this.hasRes = true;
      console.log(this.res);
    });
  }

  public onDumpClose() {
    this.res = {};
    this.hasRes = false;
    this.query = '';
  }
}
