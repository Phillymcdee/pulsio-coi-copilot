import { db } from '../server/db';
import { users, accounts, vendors, documents, timelineEvents } from '../shared/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

// Demo data seed script for COI compliance testing
async function seedDemo() {
  console.log('🌱 Starting demo data seed...');

  // Clean up existing demo data
  console.log('🧹 Cleaning up existing demo data...');
  const existingUser = await db.select().from(users).where(eq(users.email, 'demo@pulsio.app')).limit(1);
  if (existingUser.length > 0) {
    const userId = existingUser[0].id;
    const existingAccount = await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);
    if (existingAccount.length > 0) {
      const accountId = existingAccount[0].id;
      // Delete in order: timeline events, documents, vendors, account, user
      await db.delete(timelineEvents).where(eq(timelineEvents.accountId, accountId));
      const vendorsList = await db.select().from(vendors).where(eq(vendors.accountId, accountId));
      for (const v of vendorsList) {
        await db.delete(documents).where(eq(documents.vendorId, v.id));
      }
      await db.delete(vendors).where(eq(vendors.accountId, accountId));
      await db.delete(accounts).where(eq(accounts.id, accountId));
    }
    await db.delete(users).where(eq(users.id, userId));
    console.log('✓ Cleaned up existing demo data');
  }

  // 1. Create demo user
  const demoUserId = nanoid();
  const [demoUser] = await db.insert(users).values({
    id: demoUserId,
    email: 'demo@pulsio.app',
    firstName: 'Demo',
    lastName: 'User',
    profileImageUrl: null,
  }).returning();
  console.log('✓ Created demo user:', demoUser.email);

  // 2. Create demo account with COI rules configured
  const demoAccountId = nanoid();
  const [demoAccount] = await db.insert(accounts).values({
    id: demoAccountId,
    userId: demoUserId,
    companyName: 'Demo Construction Co.',
    reminderCadence: '0 9 * * *', // Daily at 9am
    emailTemplate: 'Please upload your Certificate of Insurance to remain compliant.',
    smsTemplate: 'Pulsio: Your COI is needed. Upload here: {{uploadLink}}',
    coiRules: {
      minGL: 2000000, // $2M GL minimum
      minAuto: 1000000, // $1M Auto minimum
      requireAdditionalInsured: true,
      requireWaiver: true,
      expiryWarningDays: [30, 14, 7],
    },
  }).returning();
  console.log('✓ Created demo account:', demoAccount.companyName);

  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // 3. Create vendors with different compliance states
  const vendorData = [
    // Compliant vendors
    {
      name: 'Acme Plumbing Services',
      email: 'contact@acmeplumbing.com',
      phone: '555-0101',
      coiStatus: 'compliant',
      glCoverage: 2000000,
      autoCoverage: 1000000,
      additionalInsured: true,
      waiver: true,
      expiryDate: new Date(today.getFullYear(), today.getMonth() + 6, 15), // 6 months from now
    },
    {
      name: 'Superior Electrical LLC',
      email: 'info@superiorelectric.com',
      phone: '555-0102',
      coiStatus: 'compliant',
      glCoverage: 3000000,
      autoCoverage: 1500000,
      additionalInsured: true,
      waiver: true,
      expiryDate: new Date(today.getFullYear(), today.getMonth() + 4, 20),
    },
    {
      name: 'Premium HVAC Corp',
      email: 'service@premiumhvac.com',
      phone: '555-0103',
      coiStatus: 'compliant',
      glCoverage: 2500000,
      autoCoverage: 1000000,
      additionalInsured: true,
      waiver: true,
      expiryDate: new Date(today.getFullYear(), today.getMonth() + 8, 10),
    },
    // Expiring soon (14 days)
    {
      name: 'Reliable Roofing Inc',
      email: 'admin@reliableroofing.com',
      phone: '555-0104',
      coiStatus: 'expiring',
      glCoverage: 2000000,
      autoCoverage: 1000000,
      additionalInsured: true,
      waiver: true,
      expiryDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
    {
      name: 'QuickFix Painting',
      email: 'contact@quickfixpainting.com',
      phone: '555-0105',
      coiStatus: 'expiring',
      glCoverage: 2000000,
      autoCoverage: 1000000,
      additionalInsured: true,
      waiver: true, // Fixed: must have waiver for valid expiring status
      expiryDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
    // Expiring critical (7 days)
    {
      name: 'Elite Landscaping',
      email: 'info@elitelandscaping.com',
      phone: '555-0106',
      coiStatus: 'expiring',
      glCoverage: 2000000,
      autoCoverage: 1000000,
      additionalInsured: true,
      waiver: true,
      expiryDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    // Missing COI
    {
      name: 'Budget Flooring Solutions',
      email: 'sales@budgetflooring.com',
      phone: '555-0107',
      coiStatus: 'missing',
    },
    {
      name: 'Metro Demolition Services',
      email: 'operations@metrodemolition.com',
      phone: '555-0108',
      coiStatus: 'missing',
    },
    {
      name: 'Precision Concrete Works',
      email: 'info@precisionconcrete.com',
      phone: '555-0109',
      coiStatus: 'missing',
    },
    // Violations (low coverage)
    {
      name: 'Economy Drywall Co',
      email: 'contact@economydrywall.com',
      phone: '555-0110',
      coiStatus: 'violation',
      glCoverage: 1000000, // Below $2M minimum
      autoCoverage: 500000, // Below $1M minimum
      additionalInsured: false,
      waiver: true,
      expiryDate: new Date(today.getFullYear(), today.getMonth() + 3, 15),
    },
    {
      name: 'Basic Carpentry LLC',
      email: 'admin@basiccarpentry.com',
      phone: '555-0111',
      coiStatus: 'violation',
      glCoverage: 1500000, // Below $2M minimum
      autoCoverage: 1000000,
      additionalInsured: false, // Missing additional insured
      waiver: false, // Missing waiver
      expiryDate: new Date(today.getFullYear(), today.getMonth() + 5, 20),
    },
  ];

  console.log('✓ Creating vendors and COI documents...');
  
  for (const vData of vendorData) {
    // Create vendor
    const vendorId = nanoid();
    const [vendor] = await db.insert(vendors).values({
      id: vendorId,
      accountId: demoAccountId,
      name: vData.name,
      email: vData.email,
      phone: vData.phone,
    }).returning();

    // Create COI document if not missing
    if (vData.coiStatus !== 'missing') {
      const effectiveDate = new Date(vData.expiryDate!);
      effectiveDate.setFullYear(effectiveDate.getFullYear() - 1); // 1 year before expiry

      const violations = [];
      if (vData.coiStatus === 'violation') {
        if (vData.glCoverage! < 2000000) {
          violations.push(`General Liability coverage $${(vData.glCoverage! / 1000000).toFixed(1)}M is below required $2M minimum`);
        }
        if (vData.autoCoverage! < 1000000) {
          violations.push(`Auto Liability coverage $${(vData.autoCoverage! / 1000000).toFixed(1)}M is below required $1M minimum`);
        }
        if (!vData.additionalInsured) {
          violations.push('Additional Insured endorsement is required but missing');
        }
        if (!vData.waiver) {
          violations.push('Waiver of Subrogation is required but missing');
        }
      }

      const storageKey = `demo/${vendorId}/coi-${Date.now()}.pdf`;
      await db.insert(documents).values({
        id: nanoid(),
        vendorId: vendorId,
        accountId: demoAccountId,
        type: 'COI',
        filename: `${vData.name.replace(/[^a-zA-Z0-9]/g, '_')}_COI.pdf`,
        storageKey: storageKey,
        url: `https://storage.example.com/${storageKey}`, // Demo URL
        uploadedAt: new Date(),
        parsedData: {
          effectiveDate: formatDate(effectiveDate),
          expiryDate: formatDate(vData.expiryDate!),
          glCoverage: vData.glCoverage,
          autoCoverage: vData.autoCoverage,
          additionalInsured: vData.additionalInsured,
          waiver: vData.waiver,
        },
        violations: violations.length > 0 ? violations : null,
      });

      console.log(`  - ${vendor.name}: ${vData.coiStatus} ${violations.length > 0 ? `(${violations.length} violations)` : ''}`);
    } else {
      console.log(`  - ${vendor.name}: ${vData.coiStatus}`);
    }

    // Create timeline events for reminders
    if (vData.coiStatus === 'expiring' || vData.coiStatus === 'missing') {
      const daysUntilExpiry = vData.expiryDate 
        ? Math.ceil((vData.expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      await db.insert(timelineEvents).values({
        id: nanoid(),
        accountId: demoAccountId,
        vendorId: vendorId,
        eventType: 'reminder_sent',
        title: vData.coiStatus === 'missing' ? 'COI reminder sent' : 'COI expiry reminder sent',
        description: vData.coiStatus === 'missing'
          ? 'Automated reminder sent for missing Certificate of Insurance'
          : `COI expiring in ${daysUntilExpiry} days - reminder sent`,
        metadata: {
          channel: 'email',
          docType: 'COI',
          ...(daysUntilExpiry && { daysUntilExpiry, expiryDate: formatDate(vData.expiryDate!) }),
        },
        createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      });
    }
  }

  console.log('✓ Created timeline events for reminders');
  console.log('\n✅ Demo seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - User: ${demoUser.email}`);
  console.log(`   - Account: ${demoAccount.companyName}`);
  console.log(`   - Vendors: ${vendorData.length}`);
  console.log(`   - Compliant: 3`);
  console.log(`   - Expiring: 3`);
  console.log(`   - Missing COI: 3`);
  console.log(`   - Violations: 2`);
  console.log(`\n🔑 To test: Log in with Replit Auth using any account, then manually update the userId in accounts table to '${demoUserId}' to see this demo data.`);
  console.log(`   Or create a new account and it will have empty data to test the onboarding flow.\n`);
}

// Run seed
seedDemo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
