import { Component, OnInit, Input } from '@angular/core';
import { Article } from '../globe/renders/article';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-article-viewer',
  templateUrl: './article-viewer.component.html',
  styleUrls: ['./article-viewer.component.sass']
})
export class ArticleViewerComponent implements OnInit {

  constructor() { }

  @Input() mainArticle: Article;
  @Input() resetSelection: Subject<void>;
  @Input() nearArticles: Article[];

  ngOnInit() {
  }

  closeViewer() {
    this.resetSelection.next();
  }
}
