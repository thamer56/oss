import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../app/services/auth.service';
import { TranslationService } from '../app/services/translation.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  showPassword = false;
  errorMessage: string = '';

  get t() {
    return this.translate.t;
  }

  get currentLang() {
    return this.translate.lang;
  }

  setLang(lang: 'en' | 'fr') {
    this.translate.setLang(lang);
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    public translate: TranslationService
  ) { }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.errorMessage = '';
    this.authService.login(this.username, this.password).subscribe(user => {
      if (user) {
        console.log('Login successful for:', user.nom);
        const route = this.authService.getDashboardRoute(user.role);
        this.router.navigate([route]);
      } else {
        this.errorMessage = this.t.loginError;
      }
    });
  }
}