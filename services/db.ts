import { Quote } from '../types';

const DB_NAME = 'QuoteManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'quotes';

let db: IDBDatabase;

// Function to open/initialize the database
export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Check if the DB is already open
    if (db) {
      return resolve(true);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(true);
    };

    // This event is only fired when the version changes
    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        // 'id' will be our key path
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Function to get all quotes
export const getAllQuotes = (): Promise<Quote[]> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject('DB not initialized');
        }
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => {
            console.error('Error fetching quotes:', request.error);
            reject('Error fetching quotes');
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
};

// Function to add a quote
export const addQuote = (quote: Quote): Promise<Quote> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(quote);

        request.onerror = () => {
            console.error('Error adding quote:', request.error);
            reject('Error adding quote');
        };

        request.onsuccess = () => {
            resolve(quote);
        };
    });
};

// Function to update a quote
export const updateQuote = (quote: Quote): Promise<Quote> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(quote);

        request.onerror = () => {
            console.error('Error updating quote:', request.error);
            reject('Error updating quote');
        };

        request.onsuccess = () => {
            resolve(quote);
        };
    });
};

// Function to delete a quote
export const deleteQuote = (id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => {
            console.error('Error deleting quote:', request.error);
            reject('Error deleting quote');
        };

        request.onsuccess = () => {
            resolve(id);
        };
    });
};

// Function to clear all quotes
export const clearQuotes = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => {
            console.error('Error clearing quotes:', request.error);
            reject('Error clearing quotes');
        };

        request.onsuccess = () => {
            resolve();
        };
    });
}