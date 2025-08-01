import Stripe from 'stripe';
import { storage } from '../storage';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export class StripeService {
  async createSubscription(userId: string, priceId?: string): Promise<{ subscriptionId: string; clientSecret: string }> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Use default price if not provided
    const finalPriceId = priceId || process.env.STRIPE_PRICE_ID || 'price_starter_monthly';

    let customerId = user.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
      });
      
      customerId = customer.id;
      await storage.updateUserStripeInfo(user.id, customerId);
    }

    // Check if user already has an active subscription
    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        return {
          subscriptionId: subscription.id,
          clientSecret: '',
        };
      }
    }

    // Create new subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: finalPriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user with subscription ID
    await storage.updateUserStripeInfo(user.id, customerId, subscription.id);

    const invoice = subscription.latest_invoice;
    let clientSecret = '';
    
    if (invoice && typeof invoice === 'object' && 'payment_intent' in invoice) {
      const paymentIntent = invoice.payment_intent;
      if (paymentIntent && typeof paymentIntent === 'object' && 'client_secret' in paymentIntent) {
        clientSecret = (paymentIntent as any).client_secret || '';
      }
    }

    return {
      subscriptionId: subscription.id,
      clientSecret,
    };
  }

  async createPortalSession(userId: string): Promise<string> {
    console.log(`Creating portal session for user: ${userId}`);
    
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    console.log(`User found: ${user.email}, existing customerId: ${user.stripeCustomerId}`);

    let customerId = user.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      console.log('Creating new Stripe customer...');
      
      try {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
          metadata: {
            userId: user.id,
            replit_user: 'true'
          }
        });
        
        customerId = customer.id;
        console.log(`Stripe customer created: ${customerId}`);
        
        await storage.updateUserStripeInfo(user.id, customerId);
        console.log('User updated with Stripe customer ID');
      } catch (stripeError) {
        console.error('Failed to create Stripe customer:', stripeError);
        throw new Error(`Failed to create Stripe customer: ${stripeError instanceof Error ? stripeError.message : String(stripeError)}`);
      }
    }

    const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
    if (!domain) {
      throw new Error('REPLIT_DOMAINS environment variable not configured');
    }
    
    const returnUrl = `https://${domain}/settings`;
    console.log(`Creating portal session with return URL: ${returnUrl}`);

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      console.log(`Portal session created successfully: ${session.id}`);
      return session.url;
    } catch (stripeError) {
      console.error('Failed to create billing portal session:', stripeError);
      throw new Error(`Failed to create billing portal session: ${stripeError instanceof Error ? stripeError.message : String(stripeError)}`);
    }
  }

  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionChange(subscription);
        break;
      
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
    // Find user by customer ID
    const users = await storage.getUser(''); // This would need to be implemented differently
    // Implementation would depend on having a way to find user by stripe customer ID
    console.log('Subscription changed:', subscription.id, subscription.status);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('Payment succeeded:', invoice.id);
    // Could send success notification email here
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('Payment failed:', invoice.id);
    // Could send failure notification email here
  }

  async getPricing(): Promise<{ starter: any; pro: any; agency: any }> {
    // Return static pricing info - in production, you might fetch from Stripe
    return {
      starter: {
        id: 'starter',
        name: 'Starter',
        price: 99,
        currency: 'usd',
        interval: 'month',
        features: ['200 reminders/month', 'Email & SMS reminders', 'Basic dashboard', 'QuickBooks sync'],
        priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter',
      },
      pro: {
        id: 'pro',
        name: 'Pro',
        price: 199,
        currency: 'usd',
        interval: 'month',
        features: ['500 reminders/month', 'Multi-location support', 'Advanced templates', 'Priority support'],
        priceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
      },
      agency: {
        id: 'agency',
        name: 'Agency',
        price: 399,
        currency: 'usd',
        interval: 'month',
        features: ['Unlimited reminders', 'White-label options', 'Custom integrations', 'Dedicated support'],
        priceId: process.env.STRIPE_PRICE_AGENCY || 'price_agency',
      },
    };
  }
}

export const stripeService = new StripeService();
