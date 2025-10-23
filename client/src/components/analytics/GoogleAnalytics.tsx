import { useEffect } from 'react';

// Extend the Window interface to include Google Analytics
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Google Analytics configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

export function GoogleAnalytics() {
  useEffect(() => {
    // Don't load GA in development unless explicitly enabled
    if (import.meta.env.DEV && !import.meta.env.VITE_GA_ENABLE_DEV) {
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src*="googletagmanager"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
}

// Google Analytics event tracking functions
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Pre-defined tracking events for go-to-market KPIs
export const trackingEvents = {
  // Landing page engagement
  landingPageView: () => trackEvent('page_view', { page_title: 'Landing Page' }),
  ctaClicked: (cta_text: string) => trackEvent('cta_click', { cta_text }),
  
  // Lead generation
  signupStarted: () => trackEvent('sign_up_started'),
  signupCompleted: (method: string) => trackEvent('sign_up_completed', { method }),
  demoRequested: () => trackEvent('demo_requested'),
  roiCalculatorUsed: (estimated_savings: number) => trackEvent('roi_calculator_used', { estimated_savings }),
  
  // Onboarding funnel
  onboardingStarted: () => trackEvent('onboarding_started'),
  quickbooksConnected: () => trackEvent('quickbooks_connected'),
  onboardingCompleted: () => trackEvent('onboarding_completed'),
  
  // Product engagement
  dashboardViewed: () => trackEvent('dashboard_viewed'),
  vendorDocumentUploaded: () => trackEvent('vendor_document_uploaded'),
  reminderSent: (reminder_type: string) => trackEvent('reminder_sent', { reminder_type }),
  
  // Business metrics
  discountCaptured: (discount_amount: number) => trackEvent('discount_captured', { 
    value: discount_amount,
    currency: 'USD' 
  }),
  complianceImproved: (compliance_percentage: number) => trackEvent('compliance_improved', { 
    compliance_percentage 
  }),
  
  // Sales metrics
  pricingViewed: () => trackEvent('pricing_viewed'),
  planSelected: (plan_name: string, plan_price: number) => trackEvent('plan_selected', { 
    plan_name, 
    plan_price,
    currency: 'USD'
  }),
  subscriptionStarted: (plan_name: string) => trackEvent('subscription_started', { plan_name }),
  
  // Support and success
  supportTicketCreated: () => trackEvent('support_ticket_created'),
  helpDocumentViewed: (document_name: string) => trackEvent('help_document_viewed', { document_name }),
};

// Conversion goals setup
export const setupConversionGoals = () => {
  // These should be configured in Google Analytics dashboard
  // This function helps document the goals for setup
  const goals = [
    {
      name: 'Sign Up',
      type: 'Destination',
      value: 10, // Estimated lead value
      funnel: ['/signup', '/onboarding']
    },
    {
      name: 'Onboarding Complete',
      type: 'Event',
      event: 'onboarding_completed',
      value: 50 // Higher value for qualified leads
    },
    {
      name: 'Subscription',
      type: 'Event', 
      event: 'subscription_started',
      value: 197 // Monthly subscription value
    },
    {
      name: 'Demo Request',
      type: 'Event',
      event: 'demo_requested', 
      value: 25 // Sales qualified lead value
    }
  ];
  
  console.log('Conversion goals to configure in GA:', goals);
  return goals;
};