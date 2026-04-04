import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  deleteUser,
  updateProfile,
} from "firebase/auth";
import { auth, db } from './config';
import { setDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'admin' | 'vendor' | 'buyer';
}

export interface UserProfile extends AuthUser {
  organizationName?: string;
  createdAt?: string;
  updatedAt?: string;
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

  private readonly ROLE_CACHE_KEY = 'user_role_cache';

  private getCachedRole(uid: string): 'admin' | 'vendor' | 'buyer' | null {
    try {
      const raw = localStorage.getItem(this.ROLE_CACHE_KEY);
      if (!raw) return null;
      const cache = JSON.parse(raw);
      return cache[uid] ?? null;
    } catch {
      return null;
    }
  }

  private setCachedRole(uid: string, role: 'admin' | 'vendor' | 'buyer'): void {
    try {
      const raw = localStorage.getItem(this.ROLE_CACHE_KEY);
      const cache = raw ? JSON.parse(raw) : {};
      cache[uid] = role;
      localStorage.setItem(this.ROLE_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // ignore storage errors
    }
  }

  private async getUserRoleFromFirestore(uid: string): Promise<'admin' | 'vendor' | 'buyer' | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const role = data.role as string;
        let resolved: 'admin' | 'vendor' | 'buyer' | null = null;
        if (role === 'admin' || role === 'vendor' || role === 'buyer') {
          resolved = role;
        } else if (role === 'bidder') {
          resolved = 'vendor';
        } else if (role === 'procurement_entity') {
          resolved = 'buyer';
        }
        if (resolved) this.setCachedRole(uid, resolved);
        return resolved;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user role from Firestore:', error);
      // Fall back to locally cached role (covers offline scenario)
      return this.getCachedRole(uid);
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
      if (role) this.setCachedRole(uid, role);
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

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL || null,
          organizationName: data.organizationName,
          role: data.role,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw this.handleFirebaseError(error);
    }
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      
      // Update Firebase Auth profile if name or photo changed
      if (firebaseUser && (updates.displayName || updates.photoURL)) {
        await updateProfile(firebaseUser, {
          displayName: updates.displayName || firebaseUser.displayName,
          photoURL: updates.photoURL || firebaseUser.photoURL,
        });
      }

      // Update Firestore user document
      const userDocRef = doc(db, 'users', uid);
      const updateData: Record<string, any> = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // Remove uid from update data as it shouldn't change
      delete updateData.uid;
      delete updateData.role; // Prevent role changes through this method
      
      await updateDoc(userDocRef, updateData);
      
      // Update current user in memory
      if (this.currentUser) {
        this.currentUser = {
          ...this.currentUser,
          displayName: updates.displayName || this.currentUser.displayName,
          photoURL: updates.photoURL || this.currentUser.photoURL,
        };
        this.notifyListeners(this.currentUser);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw this.handleFirebaseError(error);
    }
  }

  async deleteUserAccount(uid: string): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        throw new Error('No user is currently logged in');
      }

      if (firebaseUser.uid !== uid) {
        throw new Error('Cannot delete another user\'s account');
      }

      // Delete Firestore user document
      const userDocRef = doc(db, 'users', uid);
      await deleteDoc(userDocRef);

      // Delete Firebase Auth user
      await deleteUser(firebaseUser);

      // Clear current user
      this.currentUser = null;
      this.notifyListeners(null);
      
      console.log('User account deleted successfully');
    } catch (error) {
      console.error('Error deleting user account:', error);
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
      'auth/network-request-failed': 'No internet connection. Please connect and try again.',
    };

    const message = errorMessages[errorCode] || error?.message || 'Authentication failed';
    console.error(`Firebase error [${errorCode}]:`, message);
    return new Error(message);
  }
}

export default new AuthService();
