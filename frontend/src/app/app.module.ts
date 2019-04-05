import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GlobeComponent } from './globe/globe.component';
import { NavComponent } from './nav/nav.component';
import { ArticleViewerComponent } from './article-viewer/article-viewer.component';

import {
  SocialLoginModule,
  AuthServiceConfig,
  FacebookLoginProvider,
  LoginOpt
} from 'angularx-social-login';

const loginOptions: LoginOpt = {
  scope: 'email,user_tagged_places,user_hometown,user_location',
  return_scopes: true,
};

const config = new AuthServiceConfig([
  {
    id: FacebookLoginProvider.PROVIDER_ID,
    provider: new FacebookLoginProvider('823476348011966', loginOptions)
  }
]);

export function provideConfig() {
  return config;
}

@NgModule({
  declarations: [
    AppComponent,
    GlobeComponent,
    NavComponent,
    ArticleViewerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    SocialLoginModule,
  ],
  providers: [
    {
      provide: AuthServiceConfig,
      useFactory: provideConfig,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
