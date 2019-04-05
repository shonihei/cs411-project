import { Component, OnInit } from '@angular/core';
import { AuthService, FacebookLoginProvider, SocialUser } from 'angularx-social-login';
import { FacebookService } from '../services/facebook.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.sass']
})
export class NavComponent implements OnInit {
  query = '';
  res: {};
  hasRes = false;
  private user: SocialUser;
  private isLoggedIn: boolean;

  constructor(private authService: AuthService, private facebook: FacebookService) { }

  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.isLoggedIn = (user != null);
      if (this.isLoggedIn) {
        console.log(`currently signed in: ${this.user.name}`);
        this.facebook.getHometown().subscribe((res) => {
          console.log('hometown:');
          console.log(res);
        });
        this.facebook.getPlaces().subscribe((res) => {
          console.log('tagged places:');
          console.log(res);
        });
      }
    });
  }

  signIn() {
    this.authService.signIn(FacebookLoginProvider.PROVIDER_ID);
  }

  signOut() {
    this.authService.signOut();
  }
}
