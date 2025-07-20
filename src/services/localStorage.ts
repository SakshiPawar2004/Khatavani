// Local Storage service for Marathi Ledger Book
export interface Account {
  id: number;
  khateNumber: string;
  name: string;
  createdAt: string;
}

export interface Entry {
  id: number;
  date: string;
  accountNumber: string;
  receiptNumber?: string;
  details: string;
  amount: number;
  type: 'जमा' | 'नावे';
  createdAt: string;
}

// Storage keys
const ACCOUNTS_KEY = 'marathi_ledger_accounts';
const ENTRIES_KEY = 'marathi_ledger_entries';
const NEXT_ACCOUNT_ID_KEY = 'marathi_ledger_next_account_id';
const NEXT_ENTRY_ID_KEY = 'marathi_ledger_next_entry_id';

// Initialize with empty data
const initializeData = () => {
  if (!localStorage.getItem(ACCOUNTS_KEY)) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([]));
    localStorage.setItem(NEXT_ACCOUNT_ID_KEY, '1');
  }

  if (!localStorage.getItem(ENTRIES_KEY)) {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify([]));
    localStorage.setItem(NEXT_ENTRY_ID_KEY, '1');
  }
};

// Account operations
export const accountsStorage = {
  getAll: (): Account[] => {
    initializeData();
    const accounts = localStorage.getItem(ACCOUNTS_KEY);
    return accounts ? JSON.parse(accounts) : [];
  },

  create: (account: Omit<Account, 'id' | 'createdAt'>): Account => {
    const accounts = accountsStorage.getAll();
    const nextId = parseInt(localStorage.getItem(NEXT_ACCOUNT_ID_KEY) || '1');
    
    // Check if account number already exists
    if (accounts.some(acc => acc.khateNumber === account.khateNumber)) {
      throw new Error('Account number already exists');
    }
    
    const newAccount: Account = {
      ...account,
      id: nextId,
      createdAt: new Date().toISOString()
    };
    
    accounts.push(newAccount);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(NEXT_ACCOUNT_ID_KEY, (nextId + 1).toString());
    
    return newAccount;
  },

  update: (id: number, updates: Partial<Account>): void => {
    const accounts = accountsStorage.getAll();
    const index = accounts.findIndex(acc => acc.id === id);
    
    if (index === -1) {
      throw new Error('Account not found');
    }
    
    accounts[index] = { ...accounts[index], ...updates };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  },

  delete: (id: number): void => {
    const accounts = accountsStorage.getAll();
    const account = accounts.find(acc => acc.id === id);
    
    if (!account) {
      throw new Error('Account not found');
    }
    
    // Delete related entries first
    const entries = entriesStorage.getAll();
    const filteredEntries = entries.filter(entry => entry.accountNumber !== account.khateNumber);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(filteredEntries));
    
    // Delete the account
    const filteredAccounts = accounts.filter(acc => acc.id !== id);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filteredAccounts));
  }
};

// Entry operations
export const entriesStorage = {
  getAll: (): Entry[] => {
    initializeData();
    const entries = localStorage.getItem(ENTRIES_KEY);
    return entries ? JSON.parse(entries) : [];
  },

  getByAccount: (accountNumber: string): Entry[] => {
    const entries = entriesStorage.getAll();
    return entries.filter(entry => entry.accountNumber === accountNumber);
  },

  create: (entry: Omit<Entry, 'id' | 'createdAt'>): Entry => {
    const entries = entriesStorage.getAll();
    const accounts = accountsStorage.getAll();
    const nextId = parseInt(localStorage.getItem(NEXT_ENTRY_ID_KEY) || '1');
    
    // Verify account exists
    if (!accounts.some(acc => acc.khateNumber === entry.accountNumber)) {
      throw new Error('Account not found');
    }
    
    const newEntry: Entry = {
      ...entry,
      id: nextId,
      createdAt: new Date().toISOString()
    };
    
    entries.push(newEntry);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    localStorage.setItem(NEXT_ENTRY_ID_KEY, (nextId + 1).toString());
    
    return newEntry;
  },

  update: (id: number, updates: Partial<Entry>): void => {
    const entries = entriesStorage.getAll();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index === -1) {
      throw new Error('Entry not found');
    }
    
    entries[index] = { ...entries[index], ...updates };
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  },

  delete: (id: number): void => {
    const entries = entriesStorage.getAll();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(filteredEntries));
  }
};

// Error handling helper
export const handleStorageError = (error: any): string => {
  if (error.message) {
    return error.message;
  } else {
    return 'An unknown error occurred';
  }
};