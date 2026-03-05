// Dummy Auth Service (Mock data for UI testing)
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'admin' | 'vendor' | 'buyer';
}

// Mock user for testing - Change role here to test different user types
// Options: 'admin' (Administrator), 'buyer' (Procurement Entity), 'vendor' (Bidder)
const MOCK_USER: AuthUser = {
  uid: 'user-123',
  email: 'user@example.com',
  displayName: 'John Doe',
  photoURL: null,
  role: 'vendor', // Change this to 'vendor' or 'admin' to test different roles
};

export class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  async register(email: string, _password: string, displayName?: string): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser = {
      uid: `user-${Date.now()}`,
      email,
      displayName: displayName || 'User',
      photoURL: null,
      role: 'vendor' as const,
    };
    this.currentUser = newUser;
    this.notifyListeners(newUser);
    return newUser;
  }

  async login(email: string, _password: string): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    if (email) {
      this.currentUser = MOCK_USER;
      this.notifyListeners(MOCK_USER);
      return MOCK_USER;
    }
    throw new Error('Invalid credentials');
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.currentUser = null;
    this.notifyListeners(null);
  }

  getCurrentUser(): any | null {
    return this.currentUser;
  }

  private notifyListeners(user: AuthUser | null) {
    this.listeners.forEach(listener => listener(user));
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    // Add listener to the list
    this.listeners.push(callback);
    
    // Immediately call with current state
    setTimeout(() => {
      callback(this.currentUser);
    }, 100);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
}

export default new AuthService();
