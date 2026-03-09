import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, db } from './config';
import { setDoc, doc, getDoc } from 'firebase/firestore';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'admin' | 'vendor' | 'buyer';
}

export class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Fetch the role from Firestore
        const role = await this.getUserRoleFromFirestore(firebaseUser.uid);
        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: role || 'vendor', // Default to 'vendor' if not found
        };
      } else {
        this.currentUser = null;
      }
      this.notifyListeners(this.currentUser);
    });
  }

  private async getUserRoleFromFirestore(uid: string): Promise<'admin' | 'vendor' | 'buyer' | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const role = data.role as string;
        // Map role names if needed (e.g., 'vendor' instead of 'bidder')
        if (role === 'admin' || role === 'vendor' || role === 'buyer') {
          return role;
        }
        if (role === 'bidder') {
          return 'vendor';
        }
        if (role === 'procurement_entity') {
          return 'buyer';
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching user role from Firestore:', error);
      return null;
    }
  }

  async register(email: string, password: string, displayName?: string, organizationName?: string, role?: string): Promise<AuthUser> {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      console.log('Attempting to register:', { email, displayName });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const userRole = (role || 'vendor') as 'admin' | 'vendor' | 'buyer';
      
      const newUser: AuthUser = {
        uid,
        email: userCredential.user.email,
        displayName: displayName || userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        role: userRole,
      };
      
      // Save user profile to Firestore
      try {
        await setDoc(doc(db, 'users', uid), {
          email: email,
          displayName: displayName || '',
          organizationName: organizationName || '',
          role: userRole,
          photoURL: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('User profile saved to Firestore');
      } catch (firestoreError) {
        console.error('Error saving user profile to Firestore:', firestoreError);
        // Don't throw - user is already created in Auth, we just warn about Firestore
      }
      
      this.currentUser = newUser;
      this.notifyListeners(newUser);
      console.log('User registered successfully:', newUser);
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleFirebaseError(error);
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Fetch the role from Firestore
      const role = await this.getUserRoleFromFirestore(uid);
      
      const user: AuthUser = {
        uid: uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        role: role || 'vendor',
      };
      this.currentUser = user;
      this.notifyListeners(user);
      return user;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('Logging out user...');
      await signOut(auth);
      this.currentUser = null;
      this.notifyListeners(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw this.handleFirebaseError(error);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  private notifyListeners(user: AuthUser | null) {
    this.listeners.forEach(listener => listener(user));
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private handleFirebaseError(error: any): Error {
    const errorCode = error?.code || 'unknown-error';
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Invalid password',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/email-already-in-use': 'This email is already registered',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/operation-not-allowed': 'Email/password sign up is not enabled',
      'auth/configuration-not-found': 'Firebase is not properly configured. Please check your environment variables.',
      'auth/invalid-api-key': 'Invalid Firebase API key',
    };

    const message = errorMessages[errorCode] || error?.message || 'Authentication failed';
    console.error(`Firebase error [${errorCode}]:`, message);
    return new Error(message);
  }
}

export default new AuthService();
