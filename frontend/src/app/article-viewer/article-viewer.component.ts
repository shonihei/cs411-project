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

  @Input() article: Article;
  @Input() resetSelection: Subject<void>;

  ngOnInit() {
  }

  closeViewer() {
    this.resetSelection.next();
  }
}
