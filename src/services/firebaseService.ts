// Firebase Firestore service for Marathi Ledger Book
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Account {
  id?: string;
  khateNumber: string;
  name: string;
  createdAt?: Timestamp | Date;
}

export interface Entry {
  id?: string;
  date: string;
  accountNumber: string;
  receiptNumber?: string;
  details: string;
  amount: number;
  type: 'जमा' | 'नावे';
  createdAt?: Timestamp | Date;
}

// Collections
const ACCOUNTS_COLLECTION = 'accounts';
const ENTRIES_COLLECTION = 'entries';

// Account operations
export const accountsFirebase = {
  // Get all accounts
  getAll: async (): Promise<Account[]> => {
    try {
      const q = query(collection(db, ACCOUNTS_COLLECTION), orderBy('khateNumber'));
      const querySnapshot = await getDocs(q);
      
      const accounts: Account[] = [];
      querySnapshot.forEach((doc) => {
        accounts.push({
          id: doc.id,
          ...doc.data()
        } as Account);
      });
      
      return accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Create new account
  create: async (account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> => {
    try {
      // Check if account number already exists
      const q = query(
        collection(db, ACCOUNTS_COLLECTION), 
        where('khateNumber', '==', account.khateNumber)
      );
      const existingAccounts = await getDocs(q);
      
      if (!existingAccounts.empty) {
        throw new Error('Account number already exists');
      }

      const docRef = await addDoc(collection(db, ACCOUNTS_COLLECTION), {
        ...account,
        createdAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        ...account,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  // Update account
  update: async (id: string, updates: Partial<Account>): Promise<void> => {
    try {
      const accountRef = doc(db, ACCOUNTS_COLLECTION, id);
      await updateDoc(accountRef, updates);
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  // Delete account
  delete: async (id: string, khateNumber: string): Promise<void> => {
    try {
      // First delete all related entries
      const entriesQuery = query(
        collection(db, ENTRIES_COLLECTION),
        where('accountNumber', '==', khateNumber)
      );
      const entriesSnapshot = await getDocs(entriesQuery);
      
      // Delete all related entries
      const deletePromises = entriesSnapshot.docs.map(entryDoc => 
        deleteDoc(doc(db, ENTRIES_COLLECTION, entryDoc.id))
      );
      await Promise.all(deletePromises);

      // Then delete the account
      await deleteDoc(doc(db, ACCOUNTS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
};

// Entry operations
export const entriesFirebase = {
  // Get all entries - simplified query to avoid composite index requirement
  getAll: async (): Promise<Entry[]> => {
    try {
      // Use single field ordering to avoid composite index requirement
      const q = query(collection(db, ENTRIES_COLLECTION), orderBy('date'));
      const querySnapshot = await getDocs(q);
      
      const entries: Entry[] = [];
      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data()
        } as Entry);
      });
      
      // Sort by createdAt in memory for entries with the same date
      entries.sort((a, b) => {
        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        
        // If dates are the same, sort by createdAt
        const aCreatedAt = a.createdAt instanceof Date ? a.createdAt : 
                          a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
        const bCreatedAt = b.createdAt instanceof Date ? b.createdAt : 
                          b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
        
        return aCreatedAt.getTime() - bCreatedAt.getTime();
      });
      
      return entries;
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  },

  // Get entries by account - simplified query
  getByAccount: async (accountNumber: string): Promise<Entry[]> => {
    try {
      // Use only where clause to avoid composite index requirement
      const q = query(
        collection(db, ENTRIES_COLLECTION),
        where('accountNumber', '==', accountNumber)
      );
      const querySnapshot = await getDocs(q);
      
      const entries: Entry[] = [];
      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data()
        } as Entry);
      });
      
      // Sort by date first, then by createdAt in memory
      entries.sort((a, b) => {
        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        
        // If dates are the same, sort by createdAt
        const aCreatedAt = a.createdAt instanceof Date ? a.createdAt : 
                          a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
        const bCreatedAt = b.createdAt instanceof Date ? b.createdAt : 
                          b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
        
        return aCreatedAt.getTime() - bCreatedAt.getTime();
      });
      
      return entries;
    } catch (error) {
      console.error('Error fetching entries by account:', error);
      throw error;
    }
  },

  // Create new entry
  create: async (entry: Omit<Entry, 'id' | 'createdAt'>): Promise<Entry> => {
    try {
      // Verify account exists
      const accountsQuery = query(
        collection(db, ACCOUNTS_COLLECTION),
        where('khateNumber', '==', entry.accountNumber)
      );
      const accountsSnapshot = await getDocs(accountsQuery);
      
      if (accountsSnapshot.empty) {
        throw new Error('Account not found');
      }

      const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), {
        ...entry,
        createdAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        ...entry,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  },

  // Update entry
  update: async (id: string, updates: Partial<Entry>): Promise<void> => {
    try {
      const entryRef = doc(db, ENTRIES_COLLECTION, id);
      await updateDoc(entryRef, updates);
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  },

  // Delete entry
  delete: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, ENTRIES_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }
};

// Error handling helper
export const handleFirebaseError = (error: any): string => {
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        return 'Permission denied. Please check your Firebase security rules.';
      case 'unavailable':
        return 'Firebase service is currently unavailable. Please try again later.';
      case 'failed-precondition':
        return 'Operation failed due to a precondition. Please check your data.';
      default:
        return `Firebase error: ${error.message}`;
    }
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unknown error occurred';
  }
};