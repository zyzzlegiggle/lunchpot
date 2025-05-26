import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookmarkOutline, chevronDownOutline, logInOutline, logoGoogle, logOutOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { LoginData } from 'src/app/interfaces/login-data';
import { SignupData } from 'src/app/interfaces/signup-data';
import { AccountValidatorService } from 'src/app/services/account-validator/account-validator.service';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';

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
  @Output() savedFoodEvent = new EventEmitter<boolean>();
  showAuthModal = false;
  activeTab = 'login';
  loginData: LoginData = {email:'', password:''} 
  signupData: SignupData = {username:'',email:'', password:''}
  isLoading = false;

  constructor(
    private authService: AuthService, 
    private accountValidator: AccountValidatorService,
    private localService: LocalStorageService,
    private toastService: ToastService
  ) { 
    addIcons({
      chevronDownOutline, 
      personOutline, 
      bookmarkOutline, 
      settingsOutline, 
      logOutOutline,
      logInOutline
    
    })
  }

  async ngOnInit() {
    try {
      const response: any = await this.authService.checkUser();
      this.username = response.user.username;
      this.isLoggedIn = true;
      console.log(this.username)
    } catch (e:any) {
      console.log("No account")
    } finally {
      this.isLoggedInEvent.emit(this.isLoggedIn);
    }
    
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
      if (this.isLoading) return;
      //check
      if(this.isLoggedIn) {
        this.closeLoginModal();
         return;
      }
      this.isLoading = true;
      this.accountValidator.loginCheck(this.loginData);
      await this.authService.login(this.loginData)
      .then((data: any) => {
        console.log(data);
        this.username = data.username;
        this.isLoggedIn = true;
        this.isLoggedInEvent.emit(this.isLoggedIn);
      })
      await this.toastService.createToastSuccess(`Sign in successful`);
      this.closeLoginModal();

      
    } catch (e:any) {
      console.error(e.message);
      await this.toastService.createToastError(`Sign in failed: ${e.message}`);
    } finally {
      this.isLoading = false;
      
    }
    
  }

  async signup() {
    try {
      if (this.isLoading) return;
      if(this.isLoggedIn) {
        this.closeLoginModal();
         return;
      }
      // check
      this.isLoading = true;
      this.accountValidator.signupCheck(this.signupData);

      // Here you would implement your signup logic
      console.log('Signing up with:', this.signupData);
      const response = await this.authService.signup(this.signupData);
      await this.toastService.createToastSuccess(`Sign up successful`);
      // Reset signup form
      this.signupData = {
        username: '',
        email: '',
        password: ''
      };
    } catch (e: any) {
      await this.toastService.createToastError(`Sign up failed: ${e.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  

  logout() {
    // Implement logout logic
    this.localService.removeItem('token');
    location.reload();
  }

  @Input() set openLoginModalEvent(value: boolean) {
    if (value) {
      this.openLoginModal();
    }
  }

  savedFood() {
    this.savedFoodEvent.emit(true);
  }


}
