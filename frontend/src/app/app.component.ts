import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'my-fullstack-project';
  showChatbot = true;

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        // Hide chatbot on TV display page — no modifications to tv-display component needed
        this.showChatbot = !e.urlAfterRedirects?.includes('/tv-display');
      });
  }
}