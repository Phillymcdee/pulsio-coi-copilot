import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { OutboundSequences } from "@/components/marketing/OutboundSequences";

export default function Outbound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <OutboundSequences />
      </div>
      
      <Footer />
    </div>
  );
}