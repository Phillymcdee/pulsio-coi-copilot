import {
  users,
  accounts,
  vendors,
  documents,
  reminders,
  bills,
  timelineEvents,
  type User,
  type UpsertUser,
  type Account,
  type InsertAccount,
  type Vendor,
  type InsertVendor,
  type Document,
  type InsertDocument,
  type Reminder,
  type InsertReminder,
  type Bill,
  type InsertBill,
  type TimelineEvent,
  type InsertTimelineEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, count, sum } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;

  // Account operations
  getAccountByUserId(userId: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account>;

  // Vendor operations
  getVendorsByAccountId(accountId: string): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor>;
  getVendorByQboId(accountId: string, qboId: string): Promise<Vendor | undefined>;

  // Document operations
  getDocumentsByVendorId(vendorId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document>;

  // Reminder operations
  getRemindersByVendorId(vendorId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder>;

  // Bill operations
  getBillsByVendorId(vendorId: string): Promise<Bill[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(id: string, updates: Partial<InsertBill>): Promise<Bill>;
  getBillByQboId(accountId: string, qboId: string): Promise<Bill | undefined>;

  // Timeline operations
  getTimelineEventsByAccountId(accountId: string, limit?: number): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;

  // Dashboard stats
  getDashboardStats(accountId: string): Promise<{
    remindersSent: number;
    docsReceived: number;
    totalVendors: number;
    moneyAtRisk: number;
    missingDocs: Array<{ vendorName: string; docType: string; vendorId: string }>;
    expiringCOIs: Array<{ vendorName: string; daysUntilExpiry: number; vendorId: string }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const updates: any = { stripeCustomerId, updatedAt: new Date() };
    if (stripeSubscriptionId) {
      updates.stripeSubscriptionId = stripeSubscriptionId;
    }
    
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Account operations
  async getAccountByUserId(userId: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.userId, userId));
    return account;
  }

  async createAccount(accountData: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(accountData).returning();
    return account;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return account;
  }

  // Vendor operations
  async getVendorsByAccountId(accountId: string): Promise<Vendor[]> {
    const vendorList = await db
      .select()
      .from(vendors)
      .where(eq(vendors.accountId, accountId))
      .orderBy(asc(vendors.name));
    return vendorList;
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(vendorData).returning();
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor> {
    const [vendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async getVendorByQboId(accountId: string, qboId: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.accountId, accountId), eq(vendors.qboId, qboId)));
    return vendor;
  }

  // Document operations
  async getDocumentsByVendorId(vendorId: string): Promise<Document[]> {
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.vendorId, vendorId))
      .orderBy(desc(documents.uploadedAt));
    return docs;
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  // Reminder operations
  async getRemindersByVendorId(vendorId: string): Promise<Reminder[]> {
    const reminderList = await db
      .select()
      .from(reminders)
      .where(eq(reminders.vendorId, vendorId))
      .orderBy(desc(reminders.sentAt));
    return reminderList;
  }

  async createReminder(reminderData: InsertReminder): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values(reminderData).returning();
    return reminder;
  }

  async updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder> {
    const [reminder] = await db
      .update(reminders)
      .set(updates)
      .where(eq(reminders.id, id))
      .returning();
    return reminder;
  }

  // Bill operations
  async getBillsByVendorId(vendorId: string): Promise<Bill[]> {
    const billList = await db
      .select()
      .from(bills)
      .where(eq(bills.vendorId, vendorId))
      .orderBy(desc(bills.createdAt));
    return billList;
  }

  async createBill(billData: InsertBill): Promise<Bill> {
    const [bill] = await db.insert(bills).values(billData).returning();
    return bill;
  }

  async updateBill(id: string, updates: Partial<InsertBill>): Promise<Bill> {
    const [bill] = await db
      .update(bills)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bills.id, id))
      .returning();
    return bill;
  }

  async getBillByQboId(accountId: string, qboId: string): Promise<Bill | undefined> {
    const [bill] = await db
      .select()
      .from(bills)
      .where(and(eq(bills.accountId, accountId), eq(bills.qboId, qboId)));
    return bill;
  }

  // Timeline operations
  async getTimelineEventsByAccountId(accountId: string, limit = 50): Promise<TimelineEvent[]> {
    const events = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.accountId, accountId))
      .orderBy(desc(timelineEvents.createdAt))
      .limit(limit);
    return events;
  }

  async createTimelineEvent(eventData: InsertTimelineEvent): Promise<TimelineEvent> {
    const [event] = await db.insert(timelineEvents).values(eventData).returning();
    return event;
  }

  // Dashboard stats
  async getDashboardStats(accountId: string) {
    // Get reminder count
    const [reminderCount] = await db
      .select({ count: count() })
      .from(reminders)
      .where(eq(reminders.accountId, accountId));

    // Get document count
    const [docCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.accountId, accountId));

    // Get vendor count
    const [vendorCount] = await db
      .select({ count: count() })
      .from(vendors)
      .where(eq(vendors.accountId, accountId));

    // Get money at risk (sum of discount amounts for unpaid bills)
    const [moneyAtRiskResult] = await db
      .select({ total: sum(bills.discountAmount) })
      .from(bills)
      .where(and(
        eq(bills.accountId, accountId),
        eq(bills.isPaid, false),
        sql`${bills.discountAmount} > 0`
      ));

    // Get missing documents
    const missingDocsData = await db
      .select({
        vendorName: vendors.name,
        vendorId: vendors.id,
        w9Status: vendors.w9Status,
        coiStatus: vendors.coiStatus,
      })
      .from(vendors)
      .where(and(
        eq(vendors.accountId, accountId),
        sql`(${vendors.w9Status} = 'MISSING' OR ${vendors.coiStatus} = 'MISSING')`
      ));

    const missingDocs = missingDocsData.flatMap(vendor => {
      const docs = [];
      if (vendor.w9Status === 'MISSING') {
        docs.push({ vendorName: vendor.vendorName, docType: 'W-9', vendorId: vendor.vendorId });
      }
      if (vendor.coiStatus === 'MISSING') {
        docs.push({ vendorName: vendor.vendorName, docType: 'COI', vendorId: vendor.vendorId });
      }
      return docs;
    });

    // Get expiring COIs (within 30 days)
    const expiringCOIs = await db
      .select({
        vendorName: vendors.name,
        vendorId: vendors.id,
        coiExpiry: vendors.coiExpiry,
      })
      .from(vendors)
      .where(and(
        eq(vendors.accountId, accountId),
        sql`${vendors.coiExpiry} IS NOT NULL AND ${vendors.coiExpiry} <= NOW() + INTERVAL '30 days'`
      ));

    const expiringCOIsFormatted = expiringCOIs.map(vendor => ({
      vendorName: vendor.vendorName,
      vendorId: vendor.vendorId,
      daysUntilExpiry: vendor.coiExpiry 
        ? Math.ceil((vendor.coiExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0
    }));

    return {
      remindersSent: reminderCount.count || 0,
      docsReceived: docCount.count || 0,
      totalVendors: vendorCount.count || 0,
      moneyAtRisk: parseFloat(moneyAtRiskResult.total || '0'),
      missingDocs,
      expiringCOIs: expiringCOIsFormatted,
    };
  }
}

export const storage = new DatabaseStorage();
