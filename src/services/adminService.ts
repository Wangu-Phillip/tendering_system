import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  limit,
  addDoc,
} from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'bidder' | 'procurement_entity';
  organizationName?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SystemActivity {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  description: string;
  entityType: string;
  entityId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
}

class AdminService {
  // USER MANAGEMENT
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;
      return {
        uid: userDoc.id,
        ...userDoc.data(),
      } as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, newRole: 'bidder' | 'procurement_entity'): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  async activateUser(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUsersByRole(role: 'bidder' | 'procurement_entity'): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', role), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  // SYSTEM MONITORING
  async getSystemActivities(limitCount: number = 50): Promise<SystemActivity[]> {
    try {
      const activitiesRef = collection(db, 'systemActivities');
      const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SystemActivity[];
    } catch (error) {
      console.error('Error fetching system activities:', error);
      throw error;
    }
  }

  async getAuditLogs(limitCount: number = 100): Promise<AuditLog[]> {
    try {
      const logsRef = collection(db, 'auditLogs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalBidders: number;
    totalProcuringEntities: number;
    totalTenders: number;
    totalBids: number;
    totalContracts: number;
  }> {
    try {
      const usersRef = collection(db, 'users');
      const tendersRef = collection(db, 'tenders');
      const bidsRef = collection(db, 'bids');
      const contractsRef = collection(db, 'contracts');

      const allUsers = await getDocs(usersRef);
      const allTenders = await getDocs(tendersRef);
      const allBids = await getDocs(bidsRef);
      const allContracts = await getDocs(contractsRef);

      const bidders = allUsers.docs.filter((doc) => doc.data().role === 'bidder').length;
      const procuringEntities = allUsers.docs.filter(
        (doc) => doc.data().role === 'procurement_entity'
      ).length;

      return {
        totalUsers: allUsers.size,
        totalBidders: bidders,
        totalProcuringEntities: procuringEntities,
        totalTenders: allTenders.size,
        totalBids: allBids.size,
        totalContracts: allContracts.size,
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }

  // LOG SYSTEM ACTIVITY
  async logActivity(
    userId: string,
    action: string,
    description: string,
    entityType: string,
    entityId: string
  ): Promise<void> {
    try {
      const activitiesRef = collection(db, 'systemActivities');
      await addDoc(activitiesRef, {
        timestamp: new Date().toISOString(),
        userId,
        action,
        description,
        entityType,
        entityId,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - logging errors shouldn't break the app
    }
  }
}

export default new AdminService();
