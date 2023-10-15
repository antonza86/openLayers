import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'openLayers';

  constructor(private translate: TranslateService) {
    this.init();
  }

  init() {
    this.translate.use('en');
  }
}
