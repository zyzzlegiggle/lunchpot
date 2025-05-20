import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookmarkOutline, chevronDownOutline, logInOutline, logoGoogle, logOutOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { LoginData } from 'src/app/interfaces/login-data';
import { SignupData } from 'src/app/interfaces/signup-data';
import { AccountValidatorService } from 'src/app/services/account-validator/account-validator.service';
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
  username: string='';
  userPhotoUrl: string = '';
  showUserMenu: boolean=false;
  @Output() isLoggedInEvent = new EventEmitter<boolean>();
  showAuthModal = false;
  activeTab = 'login';
  loginData: LoginData = {email:'', password:''} 
  signupData: SignupData = {username:'',email:'', password:''}

  constructor(private authService: AuthService, private accountValidator: AccountValidatorService) { 
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
    try {
      //check
      this.accountValidator.loginCheck(this.loginData);
      console.log('Logging in with:', this.loginData);
      await this.authService.login(this.loginData)
      .then((response: any) => {
        console.log(response);
        this.username = response.username
        // For this example, we'll just simulate successful login
        this.isLoggedIn = true;
        this.closeLoginModal();
        
        // Reset login form
        this.loginData = {
          email: '',
          password: ''
        };
      })
      

      
    } catch (e:any) {
      console.error(e.message);
      alert(e.message);
    }
    
  }

  async signup() {
    try {
      // check
      this.accountValidator.signupCheck(this.signupData);

      // Here you would implement your signup logic
      console.log('Signing up with:', this.signupData);
      const response = await this.authService.signup(this.signupData);
      // Reset signup form
      this.signupData = {
        username: '',
        email: '',
        password: ''
      };
    } catch (e: any) {
      console.error(e.message);
      alert(e.message)
    } 
  }

  logout() {
    // Implement logout logic
    this.isLoggedIn = false;
  }


}
