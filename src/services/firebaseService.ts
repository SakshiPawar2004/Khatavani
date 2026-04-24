// Firebase Firestore service for Marathi Ledger Book
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
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

const normalizeAccountNumber = (value: unknown): string => String(value ?? '').trim();
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      
      // If khateNumber (account number) is being changed, update all related entries
      if (updates.khateNumber !== undefined) {
        const accountSnapshot = await getDoc(accountRef);

        if (accountSnapshot.exists()) {
          const originalAccount = accountSnapshot.data() as Account;
          const oldKhateNumber = normalizeAccountNumber(originalAccount.khateNumber);
          const newKhateNumber = normalizeAccountNumber(updates.khateNumber);

          if (oldKhateNumber !== newKhateNumber) {
            const allAccountsSnapshot = await getDocs(collection(db, ACCOUNTS_COLLECTION));
            const conflictingAccountDoc = allAccountsSnapshot.docs.find(
              (accountDoc) =>
                accountDoc.id !== id &&
                normalizeAccountNumber((accountDoc.data() as Account).khateNumber) === newKhateNumber
            );

            const allEntriesSnapshot = await getDocs(collection(db, ENTRIES_COLLECTION));
            const tempMarker = `__tmp_swap_${Date.now()}__`;

            if (conflictingAccountDoc) {
              // Swap mode: old->new and new->old without collisions.
              const swapToTemp = allEntriesSnapshot.docs
                .filter((entryDoc) => normalizeAccountNumber(entryDoc.data().accountNumber) === oldKhateNumber)
                .map((entryDoc) => updateDoc(doc(db, ENTRIES_COLLECTION, entryDoc.id), { accountNumber: tempMarker }));
              await Promise.all(swapToTemp);

              const newToOld = allEntriesSnapshot.docs
                .filter((entryDoc) => normalizeAccountNumber(entryDoc.data().accountNumber) === newKhateNumber)
                .map((entryDoc) => updateDoc(doc(db, ENTRIES_COLLECTION, entryDoc.id), { accountNumber: oldKhateNumber }));
              await Promise.all(newToOld);

              const tempToNewSnapshot = await getDocs(collection(db, ENTRIES_COLLECTION));
              const tempToNew = tempToNewSnapshot.docs
                .filter((entryDoc) => normalizeAccountNumber(entryDoc.data().accountNumber) === tempMarker)
                .map((entryDoc) => updateDoc(doc(db, ENTRIES_COLLECTION, entryDoc.id), { accountNumber: newKhateNumber }));
              await Promise.all(tempToNew);

              // Swap account numbers.
              await updateDoc(doc(db, ACCOUNTS_COLLECTION, conflictingAccountDoc.id), {
                khateNumber: oldKhateNumber
              });
            } else {
              // Simple rename mode: move all old entries to new.
              const oldToNew = allEntriesSnapshot.docs
                .filter((entryDoc) => normalizeAccountNumber(entryDoc.data().accountNumber) === oldKhateNumber)
                .map((entryDoc) => updateDoc(doc(db, ENTRIES_COLLECTION, entryDoc.id), { accountNumber: newKhateNumber }));
              await Promise.all(oldToNew);
            }

            // Keep the normalized number in the account record.
            updates.khateNumber = newKhateNumber;
          } else {
            // Repair mode: fix previously stale entries that still reference orphaned numbers.
            const allAccountsSnapshot = await getDocs(collection(db, ACCOUNTS_COLLECTION));
            const validAccountNumbers = new Set(
              allAccountsSnapshot.docs.map((accountDoc) =>
                normalizeAccountNumber((accountDoc.data() as Account).khateNumber)
              )
            );

            const accountName = String(originalAccount.name ?? '').trim();
            if (accountName) {
              const accountNameRegex = new RegExp(`^\\s*${escapeRegExp(accountName)}(?:[:：\\s]|$)`);
              const allEntriesSnapshot = await getDocs(collection(db, ENTRIES_COLLECTION));

              const orphanRepairs = allEntriesSnapshot.docs
                .filter((entryDoc) => {
                  const entryData = entryDoc.data();
                  const entryNumber = normalizeAccountNumber(entryData.accountNumber);
                  const details = String(entryData.details ?? '');
                  return (
                    entryNumber !== oldKhateNumber &&
                    !validAccountNumbers.has(entryNumber) &&
                    accountNameRegex.test(details)
                  );
                })
                .map((entryDoc) =>
                  updateDoc(doc(db, ENTRIES_COLLECTION, entryDoc.id), {
                    accountNumber: oldKhateNumber
                  })
                );

              await Promise.all(orphanRepairs);
            }
          }
        }
      }

      // Update the account itself
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
  },

  // Repair all entry-account mappings for previously changed account numbers
  repairAllEntryMappings: async (): Promise<number> => {
    try {
      const accountsSnapshot = await getDocs(collection(db, ACCOUNTS_COLLECTION));
      const entriesSnapshot = await getDocs(collection(db, ENTRIES_COLLECTION));

      const accountList = accountsSnapshot.docs.map((accountDoc) => {
        const accountData = accountDoc.data() as Account;
        return {
          khateNumber: normalizeAccountNumber(accountData.khateNumber),
          name: String(accountData.name ?? '').trim()
        };
      });

      const accountPatterns = accountList
        .filter((account) => account.name.length > 0)
        .sort((a, b) => b.name.length - a.name.length)
        .map((account) => ({
          khateNumber: account.khateNumber,
          regex: new RegExp(`^\\s*${escapeRegExp(account.name)}(?:[:：\\s]|$)`)
        }));

      let updatedCount = 0;

      const repairPromises = entriesSnapshot.docs
        .map((entryDoc) => {
          const entryData = entryDoc.data();
          const normalizedCurrentNumber = normalizeAccountNumber(entryData.accountNumber);
          const details = String(entryData.details ?? '');

          let targetAccountNumber = normalizedCurrentNumber;
          const matchedByDetails = accountPatterns.find((pattern) => pattern.regex.test(details));
          if (matchedByDetails) {
            targetAccountNumber = matchedByDetails.khateNumber;
          }

          if (targetAccountNumber && targetAccountNumber !== normalizedCurrentNumber) {
            updatedCount += 1;
            return updateDoc(doc(db, ENTRIES_COLLECTION, entryDoc.id), {
              accountNumber: targetAccountNumber
            });
          }

          // Also normalize legacy non-string values like 16 -> "16"
          if (entryData.accountNumber !== normalizedCurrentNumber) {
            updatedCount += 1;
            return updateDoc(doc(db, ENTRIES_COLLECTION, entryDoc.id), {
              accountNumber: normalizedCurrentNumber
            });
          }

          return Promise.resolve();
        });

      await Promise.all(repairPromises);
      return updatedCount;
    } catch (error) {
      console.error('Error repairing entry mappings:', error);
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
      // Read all and filter in memory so legacy number/string mismatches still work.
      const q = query(collection(db, ENTRIES_COLLECTION), orderBy('date'));
      const querySnapshot = await getDocs(q);
      const requestedNumber = normalizeAccountNumber(accountNumber);
      
      const entries: Entry[] = [];
      querySnapshot.forEach((doc) => {
        const entryData = doc.data() as Entry;
        if (normalizeAccountNumber(entryData.accountNumber) === requestedNumber) {
          entries.push({
            id: doc.id,
            ...entryData,
            accountNumber: normalizeAccountNumber(entryData.accountNumber)
          } as Entry);
        }
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