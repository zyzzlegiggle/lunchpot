import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookmarkOutline, chevronDownOutline, logInOutline, logoGoogle, logOutOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { LoginData } from 'src/app/interfaces/login-data';
import { SignupData } from 'src/app/interfaces/signup-data';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  imports: [IonIcon, CommonModule, FormsModule]
})
export class AccountComponent  implements OnInit {
  isLoggedIn: boolean = false;
  userName: string='';
  userPhotoUrl: string = '';
  showUserMenu: boolean=false;
  @Output() isLoggedInEvent = new EventEmitter<boolean>();
  showAuthModal = false;
  activeTab = 'login';
  loginData: LoginData = {email:'', password:''} 
  signupData: SignupData = {username:'',email:'', password:''}

  constructor(private authService: AuthService) { 
    addIcons({
      chevronDownOutline, 
      personOutline, 
      bookmarkOutline, 
      settingsOutline, 
      logOutOutline,
      logInOutline
    
    })
  }

  ngOnInit() {
    this.isLoggedInEvent.emit(this.isLoggedIn);
  }

  
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

   openLoginModal() {
    this.showAuthModal = true;
  }

  closeLoginModal() {
    this.showAuthModal = false;
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  async login() {
    console.log('Logging in with:', this.loginData);
    const response = await this.authService.login(this.loginData);
    console.log(response)
    
    // For this example, we'll just simulate successful login
    this.isLoggedIn = true;
    this.closeLoginModal();
    
    // Reset login form
    this.loginData = {
      email: '',
      password: ''
    };
  }

  signup() {
    // Here you would implement your signup logic
    console.log('Signing up with:', this.signupData);
    
    // For this example, we'll simulate successful signup and login
    this.isLoggedIn = true;
    this.closeLoginModal();
    
    // Reset signup form
    this.signupData = {
      username: '',
      email: '',
      password: ''
    };
  }

  logout() {
    // Implement logout logic
    this.isLoggedIn = false;
  }


}
