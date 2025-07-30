import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Account table for company settings
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  companyName: varchar("company_name").notNull(),
  fromName: varchar("from_name"), // Custom sender display name for emails
  qboCompanyId: varchar("qbo_company_id"),
  qboAccessToken: text("qbo_access_token"),
  qboRefreshToken: text("qbo_refresh_token"),
  qboTokenExpiry: timestamp("qbo_token_expiry"),
  reminderCadence: varchar("reminder_cadence").default('0 9 * * *'), // Daily at 9 AM
  emailTemplate: text("email_template"),
  smsTemplate: text("sms_template"),
  plan: varchar("plan").default('starter'), // starter, pro, agency
  timeToFirstDoc: integer("time_to_first_doc"),
  isOnboardingComplete: boolean("is_onboarding_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document status and reminder type enums
export const docStateEnum = pgEnum('doc_state', ['MISSING', 'RECEIVED', 'EXPIRED']);
export const reminderTypeEnum = pgEnum('reminder_type', ['W9', 'COI']);
export const reminderChannelEnum = pgEnum('reminder_channel', ['email', 'sms']);

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  qboId: varchar("qbo_id"), // Nullable for manually added vendors
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  w9Status: docStateEnum("w9_status").default('MISSING'),
  coiStatus: docStateEnum("coi_status").default('MISSING'),
  coiExpiry: timestamp("coi_expiry"),
  isExempt: boolean("is_exempt").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  type: reminderTypeEnum("type").notNull(),
  filename: varchar("filename").notNull(),
  storageKey: varchar("storage_key").notNull(), // Replit Object Storage key
  url: varchar("url").notNull(), // Public URL
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  extractedText: text("extracted_text"), // OCR extracted text for COI documents
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  type: reminderTypeEnum("type").notNull(),
  channel: reminderChannelEnum("channel").notNull(),
  recipient: varchar("recipient").notNull(), // email or phone
  subject: varchar("subject"),
  message: text("message").notNull(),
  status: varchar("status").default('sent'), // sent, delivered, failed, bounced
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

// Bills table for QuickBooks sync
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  qboId: varchar("qbo_id").notNull(),
  billNumber: varchar("bill_number"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  discountDueDate: timestamp("discount_due_date"),
  isPaid: boolean("is_paid").default(false),
  paidDate: timestamp("paid_date"),
  discountCaptured: boolean("discount_captured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity timeline events
export const timelineEvents = pgTable("timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  eventType: varchar("event_type").notNull(), // reminder_sent, doc_received, qbo_sync, etc.
  title: varchar("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional event data
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  account: one(accounts, { fields: [users.id], references: [accounts.userId] }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  vendors: many(vendors),
  documents: many(documents),
  reminders: many(reminders),
  bills: many(bills),
  timelineEvents: many(timelineEvents),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  account: one(accounts, { fields: [vendors.accountId], references: [accounts.id] }),
  documents: many(documents),
  reminders: many(reminders),
  bills: many(bills),
  timelineEvents: many(timelineEvents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  vendor: one(vendors, { fields: [documents.vendorId], references: [vendors.id] }),
  account: one(accounts, { fields: [documents.accountId], references: [accounts.id] }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  vendor: one(vendors, { fields: [reminders.vendorId], references: [vendors.id] }),
  account: one(accounts, { fields: [reminders.accountId], references: [accounts.id] }),
}));

export const billsRelations = relations(bills, ({ one }) => ({
  vendor: one(vendors, { fields: [bills.vendorId], references: [vendors.id] }),
  account: one(accounts, { fields: [bills.accountId], references: [accounts.id] }),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  account: one(accounts, { fields: [timelineEvents.accountId], references: [accounts.id] }),
  vendor: one(vendors, { fields: [timelineEvents.vendorId], references: [vendors.id] }),
}));

// Zod schemas for validation
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
