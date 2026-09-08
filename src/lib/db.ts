import { User, FundingWindow, FormQuestion, GrantSubmission, AuditLogEntry } from '../types';
import { hashPassword, generateSalt } from './crypto';

const DB_NAME = 'EqualGrantDB_v1';
const DB_VERSION = 1;

class CompatibleDatabase {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
        }
        if (!db.objectStoreNames.contains('fundingWindows')) {
          db.createObjectStore('fundingWindows', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('formQuestions')) {
          db.createObjectStore('formQuestions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('submissions')) {
          const subStore = db.createObjectStore('submissions', { keyPath: 'id' });
          subStore.createIndex('callId', 'callId', { unique: false });
          subStore.createIndex('applicantId', 'applicantId', { unique: false });
        }
        if (!db.objectStoreNames.contains('auditLogs')) {
          db.createObjectStore('auditLogs', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await this.getDB();
      // Check if seeded, if not seed default accounts and demo grants
      const users = await this.getAll<User>('users');
      if (users.length === 0) {
        await this.seedInitialData();
      }
      await this.removeDemoFundingWindows();
      this.isInitialized = true;
    } catch (err) {
      console.warn('IndexedDB initialization failed, using localStorage fallback', err);
      this.initLocalStorageFallback();
      this.isInitialized = true;
    }
  }

  private async seedInitialData(): Promise<void> {
    const saltFunder = generateSalt();
    const hashFunder = await hashPassword('Funder123!', saltFunder);
    const demoFunder: User = {
      id: 'usr-funder-demo',
      email: 'funder@equalgrant.org',
      fullName: 'Dr. Amina Bello',
      org: 'Gender Equality Club Nigeria',
      role: 'funder',
      passwordHash: hashFunder,
      salt: saltFunder,
      createdAt: new Date().toISOString(),
    };

    const saltAwardee = generateSalt();
    const hashAwardee = await hashPassword('Awardee123!', saltAwardee);
    const demoAwardee: User = {
      id: 'usr-awardee-demo',
      email: 'applicant@grassroots.org',
      fullName: 'Chidi Okafor',
      org: 'West Africa Youth & STEM Network',
      role: 'awardee',
      passwordHash: hashAwardee,
      salt: saltAwardee,
      createdAt: new Date().toISOString(),
    };

    await this.put('users', demoFunder);
    await this.put('users', demoAwardee);

    // Default form questions matching documentation
    const q1: FormQuestion = {
      id: 'q1',
      label: 'Describe the problem your project addresses',
      type: 'textarea',
      maxWords: 250,
      required: true,
    };
    const q2: FormQuestion = {
      id: 'q2',
      label: 'Proposed solution and methodology',
      type: 'textarea',
      maxWords: 400,
      required: true,
    };
    await this.put('formQuestions', q1);
    await this.put('formQuestions', q2);

    // Initial audit log
    await this.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DATABASE_INITIALIZED',
      userEmail: 'system@equalgrant.org',
      userRole: 'system',
      details: 'EqualGrant Manager compatible database seeded with initial opportunities.',
    });
  }

  private initLocalStorageFallback() {
    if (!localStorage.getItem('eq_users')) {
      localStorage.setItem('eq_users', JSON.stringify([]));
      localStorage.setItem('eq_fundingWindows', JSON.stringify([]));
      localStorage.setItem('eq_formQuestions', JSON.stringify([]));
      localStorage.setItem('eq_submissions', JSON.stringify([]));
      localStorage.setItem('eq_auditLogs', JSON.stringify([]));
    }
  }

  private async removeDemoFundingWindows(): Promise<void> {
    await this.delete('fundingWindows', 'demo-1');
    await this.delete('fundingWindows', 'demo-2');
  }

  // Generic IndexedDB helpers
  private async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const raw = localStorage.getItem(`eq_${storeName}`);
      return raw ? JSON.parse(raw) : [];
    }
  }

  private async get<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getAll<T>(storeName);
      return (list as any[]).find((item: any) => item.id === id) || null;
    }
  }

  private async put<T>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getAll<any>(storeName);
      const index = list.findIndex((i: any) => i.id === (item as any).id);
      if (index >= 0) list[index] = item;
      else list.push(item);
      localStorage.setItem(`eq_${storeName}`, JSON.stringify(list));
    }
  }

  private async delete(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getAll<any>(storeName);
      const filtered = list.filter((i: any) => i.id !== id);
      localStorage.setItem(`eq_${storeName}`, JSON.stringify(filtered));
    }
  }

  private async clearStore(storeName: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.setItem(`eq_${storeName}`, JSON.stringify([]));
    }
  }

  // Specialized API methods

  // Users
  public async getUsers(): Promise<User[]> {
    return this.getAll<User>('users');
  }

  public async getUserById(id: string): Promise<User | null> {
    return this.get<User>('users', id);
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public async saveUser(user: User): Promise<void> {
    await this.put('users', user);
  }

  // Funding Windows
  public async getFundingWindows(): Promise<FundingWindow[]> {
    const list = await this.getAll<FundingWindow>('fundingWindows');
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getFundingWindow(id: string): Promise<FundingWindow | null> {
    return this.get<FundingWindow>('fundingWindows', id);
  }

  public async saveFundingWindow(call: FundingWindow): Promise<void> {
    await this.put('fundingWindows', call);
  }

  public async deleteFundingWindow(id: string): Promise<void> {
    await this.delete('fundingWindows', id);
  }

  // Form Questions
  public async getFormQuestions(): Promise<FormQuestion[]> {
    const list = await this.getAll<FormQuestion>('formQuestions');
    return list.length > 0
      ? list
      : [
          {
            id: 'q1',
            label: 'Describe the problem your project addresses',
            type: 'textarea',
            maxWords: 250,
            required: true,
          },
          {
            id: 'q2',
            label: 'Proposed solution and methodology',
            type: 'textarea',
            maxWords: 400,
            required: true,
          },
        ];
  }

  public async saveFormQuestions(questions: FormQuestion[]): Promise<void> {
    await this.clearStore('formQuestions');
    for (const q of questions) {
      await this.put('formQuestions', q);
    }
  }

  // Submissions
  public async getSubmissions(): Promise<GrantSubmission[]> {
    const list = await this.getAll<GrantSubmission>('submissions');
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public async getSubmissionsByApplicant(applicantId: string): Promise<GrantSubmission[]> {
    const all = await this.getSubmissions();
    return all.filter(s => s.applicantId === applicantId);
  }

  public async getSubmissionsByCall(callId: string): Promise<GrantSubmission[]> {
    const all = await this.getSubmissions();
    return all.filter(s => s.callId === callId);
  }

  public async saveSubmission(sub: GrantSubmission): Promise<void> {
    await this.put('submissions', sub);
  }

  // Audit Logs
  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    const logs = await this.getAll<AuditLogEntry>('auditLogs');
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public async addAuditLog(entry: AuditLogEntry): Promise<void> {
    await this.put('auditLogs', entry);
  }

  // Admin & Data portability for GitHub Pages static deployments
  public async exportDatabaseJSON(): Promise<string> {
    const data = {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      users: (await this.getUsers()).map(u => ({ ...u, passwordHash: '***PROTECTED***', salt: '***PROTECTED***' })),
      fundingWindows: await this.getFundingWindows(),
      formQuestions: await this.getFormQuestions(),
      submissions: await this.getSubmissions(),
      auditLogs: await this.getAuditLogs(),
    };
    return JSON.stringify(data, null, 2);
  }

  public async resetToCleanSystem(): Promise<void> {
    await this.clearStore('fundingWindows');
    await this.clearStore('submissions');
    await this.clearStore('auditLogs');
    await this.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_RESET_CLEAN',
      userEmail: 'system@equalgrant.org',
      userRole: 'system',
      details: 'System cleared: 0 records • Clean enterprise slate ready for production testing.',
    });
  }

  public async seedDemoOpportunities(): Promise<void> {
    await this.seedInitialData();
  }
}

export const db = new CompatibleDatabase();
