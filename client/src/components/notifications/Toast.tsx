import { useSSE } from "@/hooks/useSSE";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function Toast() {
  const { events } = useSSE("/api/events");
  const { toast } = useToast();

  useEffect(() => {
    events.forEach((event) => {
      if (event.event === 'doc.received') {
        toast({
          title: "Document Received! ✅",
          description: event.data.message,
          variant: "default",
        });
      } else if (event.event === 'reminder.sent') {
        toast({
          title: "Reminder Sent 📧",
          description: event.data.message,
          variant: "default",
        });
      } else if (event.event === 'discount.captured') {
        toast({
          title: "Discount Captured! 💰",
          description: event.data.message,
          variant: "default",
        });
      } else if (event.event === 'coi.expiring') {
        toast({
          title: "COI Expiring Soon ⚠️",
          description: event.data.message,
          variant: "destructive",
        });
      }
    });
  }, [events, toast]);

  return null; // This component doesn't render anything
}
