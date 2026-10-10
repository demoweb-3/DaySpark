import { DB_NAME, DB_VERSION, TASKS_STORE, SETTINGS_STORE, SETTINGS_KEY } from '../constants';
import type { Settings, Task } from '../types';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database upgrade blocked. Please close other tabs of this app.'));

    request.onupgradeneeded = (_event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        const store = db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
        store.createIndex('order', 'order', { unique: false });
        store.createIndex('completed', 'completed', { unique: false });
        store.createIndex('dueDate', 'dueDate', { unique: false });
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });

  return dbPromise;
}

function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store);
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Task operations ---

export async function dbGetAllTasks(): Promise<Task[]> {
  const db = await openDB();
  const tasks = await promisifyRequest(tx(db, TASKS_STORE, 'readonly').getAll());
  return tasks.sort((a, b) => a.order - b.order);
}

export async function dbPutTask(task: Task): Promise<void> {
  const db = await openDB();
  await promisifyRequest(tx(db, TASKS_STORE, 'readwrite').put(task));
}

export async function dbPutTasks(tasks: Task[]): Promise<void> {
  const db = await openDB();
  const store = tx(db, TASKS_STORE, 'readwrite');
  for (const t of tasks) {
    store.put(t);
  }
  await new Promise<void>((resolve, reject) => {
    store.transaction.oncomplete = () => resolve();
    store.transaction.onerror = () => reject(store.transaction.error);
  });
}

export async function dbDeleteTask(id: string): Promise<void> {
  const db = await openDB();
  await promisifyRequest(tx(db, TASKS_STORE, 'readwrite').delete(id));
}

export async function dbClearTasks(): Promise<void> {
  const db = await openDB();
  await promisifyRequest(tx(db, TASKS_STORE, 'readwrite').clear());
}

// --- Settings operations ---

export async function dbGetSettings(): Promise<Settings | null> {
  const db = await openDB();
  const result = await promisifyRequest(
    tx(db, SETTINGS_STORE, 'readonly').get(SETTINGS_KEY)
  );
  return (result as { key: string; value: Settings } | undefined)?.value ?? null;
}

export async function dbPutSettings(settings: Settings): Promise<void> {
  const db = await openDB();
  await promisifyRequest(
    tx(db, SETTINGS_STORE, 'readwrite').put({ key: SETTINGS_KEY, value: settings })
  );
}
