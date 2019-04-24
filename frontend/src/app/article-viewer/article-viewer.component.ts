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

  // main article to display
  @Input() mainArticle: Article;
  // subject to signal parent component that the user closed the viewer
  @Input() resetSelection: Subject<void>;
  // articles that are physically near the main article
  @Input() nearArticles: Article[];

  ngOnInit() {
  }

  closeViewer() {
    this.resetSelection.next();
  }
}
