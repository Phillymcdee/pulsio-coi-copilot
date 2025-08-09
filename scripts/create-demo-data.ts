
import { storage } from '../server/storage';
import { quickbooksService } from '../server/services/quickbooks';

// Realistic contractor names and data
const contractors = [
  {
    name: "Smith Plumbing LLC",
    email: "office@smithplumbing.com",
    phone: "(555) 234-5678",
    w9Status: "MISSING" as const,
    coiStatus: "MISSING" as const,
  },
  {
    name: "ABC Electric Inc",
    email: "billing@abcelectric.com", 
    phone: "(555) 345-6789",
    w9Status: "RECEIVED" as const,
    coiStatus: "EXPIRED" as const,
    coiExpiry: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Expired 15 days ago
  },
  {
    name: "Premier HVAC Services",
    email: "admin@premierhvac.com",
    phone: "(555) 456-7890", 
    w9Status: "MISSING" as const,
    coiStatus: "RECEIVED" as const,
  },
  {
    name: "Johnson Construction Co",
    email: "payments@johnsonconstruction.com",
    phone: "(555) 567-8901",
    w9Status: "RECEIVED" as const,
    coiStatus: "MISSING" as const,
  },
  {
    name: "Elite Roofing Solutions",
    email: "info@eliteroofing.com",
    phone: "(555) 678-9012",
    w9Status: "MISSING" as const,
    coiStatus: "EXPIRED" as const,
    coiExpiry: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // Expired 8 days ago
  },
  {
    name: "Precision Painting LLC",
    email: "estimates@precisionpainting.com",
    phone: "(555) 789-0123",
    w9Status: "RECEIVED" as const,
    coiStatus: "RECEIVED" as const,
  },
  {
    name: "Metro Landscaping Inc",
    email: "billing@metrolandscaping.com", 
    phone: "(555) 890-1234",
    w9Status: "MISSING" as const,
    coiStatus: "MISSING" as const,
  },
  {
    name: "Superior Tile Works",
    email: "office@superiortile.com",
    phone: "(555) 901-2345",
    w9Status: "RECEIVED" as const,
    coiStatus: "EXPIRED" as const,
    coiExpiry: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // Expired 25 days ago
  },
  {
    name: "Reliable Concrete Solutions",
    email: "scheduling@reliableconcrete.com",
    phone: "(555) 012-3456",
    w9Status: "MISSING" as const,
    coiStatus: "RECEIVED" as const,
  },
  {
    name: "Advanced Security Systems",
    email: "service@advancedsecurity.com",
    phone: "(555) 123-4567",
    w9Status: "MISSING" as const,
    coiStatus: "MISSING" as const,
  },
  {
    name: "Quality Drywall Contractors",
    email: "jobs@qualitydrywall.com",
    phone: "(555) 234-5670",
    w9Status: "RECEIVED" as const,
    coiStatus: "EXPIRED" as const,
    coiExpiry: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Expired 3 days ago
  },
  {
    name: "ProCare Cleaning Services",
    email: "admin@procarecleaning.com",
    phone: "(555) 345-6701",
    w9Status: "MISSING" as const,
    coiStatus: "RECEIVED" as const,
  },
  {
    name: "Certified Fire Protection",
    email: "permits@certifiedfire.com",
    phone: "(555) 456-7012",
    w9Status: "RECEIVED" as const,
    coiStatus: "MISSING" as const,
  },
  {
    name: "Expert Window Installation",
    email: "sales@expertwindows.com",
    phone: "(555) 567-8023",
    w9Status: "MISSING" as const,
    coiStatus: "EXPIRED" as const,
    coiExpiry: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // Expired 12 days ago
  },
  {
    name: "Specialized Pool Services",
    email: "maintenance@specializedpools.com",
    phone: "(555) 678-9034",
    w9Status: "RECEIVED" as const,
    coiStatus: "RECEIVED" as const,
  },
  {
    name: "Professional Pest Control",
    email: "dispatch@professionalpest.com",
    phone: "(555) 789-0145",
    w9Status: "MISSING" as const,
    coiStatus: "MISSING" as const,
  },
  {
    name: "Artisan Stonework LLC",
    email: "projects@artisanstone.com",
    phone: "(555) 890-1256",
    w9Status: "RECEIVED" as const,
    coiStatus: "EXPIRED" as const,
    coiExpiry: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // Expired 18 days ago
  },
  {
    name: "Dynamic Demolition Co",
    email: "permits@dynamicdemolition.com",
    phone: "(555) 901-2367",
    w9Status: "MISSING" as const,
    coiStatus: "RECEIVED" as const,
  },
];

// Bill data with realistic amounts and 2%/10 net 30 terms
const billAmounts = [
  850.00, 1240.50, 2100.00, 3450.75, 920.25, 1680.00, 4200.80, 
  750.00, 2890.40, 1150.60, 5250.00, 980.75, 1790.20, 3100.00,
  6800.50, 1420.30, 2750.40, 890.00, 4150.25, 2340.80, 1560.00,
  7200.00, 1980.50, 3850.75, 1120.40, 2480.60, 5400.20, 840.00
];

export async function createDemoData(): Promise<void> {
  try {
    console.log('🚀 Creating realistic demo data...');

    // Get the user's account
    const accounts = await storage.getAllAccounts();
    if (accounts.length === 0) {
      console.error('❌ No accounts found. Please set up an account first.');
      return;
    }
    
    const account = accounts[0];
    console.log(`📊 Creating demo data for account: ${account.companyName}`);

    // Create payment terms first (2%/10 net 30)
    console.log('💰 Creating payment terms...');
    const paymentTerms = await storage.createTerms({
      accountId: account.id,
      qboId: 'DEMO_TERMS_001',
      name: '2%/10 Net 30',
      type: 'STANDARD',
      dueDays: 30,
      discountPercent: '2.00',
      discountDays: 10,
      active: true,
      qboLastSyncAt: new Date(),
    });

    console.log('👷 Creating contractors...');
    const createdVendors = [];
    
    for (const contractor of contractors) {
      const vendor = await storage.createVendor({
        accountId: account.id,
        qboId: `DEMO_${Math.random().toString(36).substr(2, 9)}`,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        w9Status: contractor.w9Status,
        coiStatus: contractor.coiStatus,
        coiExpiry: contractor.coiExpiry || null,
        qboName: contractor.name,
        qboEmail: contractor.email,
        qboPhone: contractor.phone,
        qboLastSyncAt: new Date(),
      });
      
      createdVendors.push(vendor);
      console.log(`✅ Created: ${contractor.name} (W9: ${contractor.w9Status}, COI: ${contractor.coiStatus})`);
    }

    console.log('💸 Creating bills with 2%/10 payment terms...');
    let billIndex = 0;
    
    for (const vendor of createdVendors) {
      // Create 1-2 bills per vendor
      const numBills = Math.random() > 0.6 ? 2 : 1;
      
      for (let i = 0; i < numBills; i++) {
        const amount = billAmounts[billIndex % billAmounts.length];
        const dueDate = new Date(Date.now() + (25 + Math.random() * 10) * 24 * 60 * 60 * 1000); // Due in 25-35 days
        const discountDueDate = new Date(Date.now() + (5 + Math.random() * 10) * 24 * 60 * 60 * 1000); // Discount available for 5-15 days
        const discountAmount = amount * 0.02; // 2% discount
        
        await storage.createBill({
          accountId: account.id,
          vendorId: vendor.id,
          qboId: `DEMO_BILL_${Math.random().toString(36).substr(2, 9)}`,
          billNumber: `INV-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
          amount: amount.toString(),
          balance: amount.toString(),
          dueDate,
          termsId: paymentTerms.id,
          discountPercent: '2.00',
          discountAmount: discountAmount.toString(),
          discountDueDate,
          isPaid: false,
          discountCaptured: false,
          qboLastSyncAt: new Date(),
        });
        
        billIndex++;
        console.log(`💰 Created bill for ${vendor.name}: $${amount.toFixed(2)} (2% discount: $${discountAmount.toFixed(2)})`);
      }
    }

    // Create timeline events for recent activity
    console.log('📅 Creating timeline events...');
    const eventTypes = [
      { type: 'reminder_sent', title: 'W-9 reminder sent', description: 'Email reminder sent for missing W-9 form' },
      { type: 'reminder_sent', title: 'COI reminder sent', description: 'Certificate of Insurance reminder sent' },
      { type: 'vendor_added', title: 'New vendor added', description: 'Vendor added from QuickBooks sync' },
      { type: 'doc_expired', title: 'COI expired', description: 'Certificate of Insurance has expired' },
      { type: 'qbo_sync', title: 'QuickBooks sync', description: 'Vendor and bill data synchronized' },
    ];

    for (let i = 0; i < 15; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const randomVendor = createdVendors[Math.floor(Math.random() * createdVendors.length)];
      const daysAgo = Math.floor(Math.random() * 14); // Events from last 14 days
      
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: Math.random() > 0.3 ? randomVendor.id : undefined, // 70% chance of vendor-specific event
        eventType: eventType.type,
        title: eventType.title,
        description: `${eventType.description} - ${randomVendor.name}`,
        metadata: { 
          vendorName: randomVendor.name,
          automated: true,
          demo: true 
        },
      });
    }

    // Calculate and display summary
    const stats = await storage.getDashboardStats(account.id);
    const moneyAtRisk = await storage.getBillsWithDiscountInfo(account.id);
    const totalDiscountAvailable = moneyAtRisk.reduce((sum, bill) => {
      return sum + (bill.canCaptureDiscount ? parseFloat(bill.discountAmount.toString()) : 0);
    }, 0);

    console.log('\n🎉 Demo data created successfully!');
    console.log('📊 Summary:');
    console.log(`   👷 Total contractors: ${contractors.length}`);
    console.log(`   ✅ Compliant: ${stats.compliantVendors}`);
    console.log(`   ❌ Missing documents: ${stats.missingDocsCount}`);
    console.log(`   💰 Early payment discounts available: $${totalDiscountAvailable.toFixed(2)}`);
    console.log(`   📧 Total reminders sent: ${stats.remindersSent}`);
    console.log('\n🚨 Key demo points:');
    console.log('   • Several contractors missing W-9 forms');
    console.log('   • Multiple expired COI certificates');
    console.log('   • Thousands in early payment discounts at risk');
    console.log('   • 2%/10 Net 30 payment terms showing real savings opportunity');
    
  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  createDemoData()
    .then(() => {
      console.log('✅ Demo data creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to create demo data:', error);
      process.exit(1);
    });
}
