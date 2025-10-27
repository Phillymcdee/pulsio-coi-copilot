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
  // QuickBooks OAuth fields
  qboCompanyId: varchar("qbo_company_id"),
  qboAccessToken: text("qbo_access_token"),
  qboRefreshToken: text("qbo_refresh_token"),
  qboTokenExpiry: timestamp("qbo_token_expiry"),
  // Jobber OAuth fields
  jobberAccountId: varchar("jobber_account_id"),
  jobberAccessToken: text("jobber_access_token"),
  jobberRefreshToken: text("jobber_refresh_token"),
  jobberTokenExpiry: timestamp("jobber_token_expiry"),
  // COI compliance rules (JSON schema)
  coiRules: jsonb("coi_rules"),
  // General settings
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
export const reminderTypeEnum = pgEnum('reminder_type', ['W9', 'COI']); // W9 kept for backward compatibility, hidden from UI
export const reminderChannelEnum = pgEnum('reminder_channel', ['email', 'sms']);

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  qboId: varchar("qbo_id"), // Nullable for manually added vendors
  jobberId: varchar("jobber_id"), // Nullable for manually added vendors, maps to Jobber client ID
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  // QuickBooks source fields (automatically synced)
  qboName: varchar("qbo_name"), // Name from QuickBooks
  qboEmail: varchar("qbo_email"), // Email from QuickBooks  
  qboPhone: varchar("qbo_phone"), // Phone from QuickBooks
  qboLastSyncAt: timestamp("qbo_last_sync_at"), // Last QB sync timestamp
  // User override flags
  nameOverride: boolean("name_override").default(false),
  emailOverride: boolean("email_override").default(false), 
  phoneOverride: boolean("phone_override").default(false),
  // Compliance-specific fields (app managed)
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
  parsedData: jsonb("parsed_data"), // Parsed COI fields (effectiveDate, expiryDate, glCoverage, autoCoverage, additionalInsured, waiverOfSubrogation)
  violations: jsonb("violations"), // Array of compliance violations from rules evaluation
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

// Terms table for QuickBooks payment terms
export const terms = pgTable("terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  qboId: varchar("qbo_id").notNull(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // STANDARD or DATE_DRIVEN
  dueDays: integer("due_days"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
  discountDays: integer("discount_days"),
  dayOfMonthDue: integer("day_of_month_due"),
  discountDayOfMonth: integer("discount_day_of_month"),
  dueNextMonthDays: integer("due_next_month_days"),
  active: boolean("active").default(true),
  qboLastSyncAt: timestamp("qbo_last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bills table for QuickBooks sync
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  qboId: varchar("qbo_id").notNull(),
  billNumber: varchar("bill_number"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  termsId: varchar("terms_id").references(() => terms.id),
  // Calculated fields based on terms
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  discountDueDate: timestamp("discount_due_date"),
  isPaid: boolean("is_paid").default(false),
  paidDate: timestamp("paid_date"),
  discountCaptured: boolean("discount_captured").default(false),
  qboLastSyncAt: timestamp("qbo_last_sync_at"),
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
  terms: many(terms),
  timelineEvents: many(timelineEvents),
}));

export const termsRelations = relations(terms, ({ one, many }) => ({
  account: one(accounts, { fields: [terms.accountId], references: [accounts.id] }),
  bills: many(bills),
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
  terms: one(terms, { fields: [bills.termsId], references: [terms.id] }),
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

export const insertTermsSchema = createInsertSchema(terms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type InsertTerms = z.infer<typeof insertTermsSchema>;
export type Terms = typeof terms.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
