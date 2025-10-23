import { useQuery } from "@tanstack/react-query";
import { useSSE } from "@/hooks/useSSE";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  FileText, 
  FolderSync, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  DollarSign,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'reminder_sent':
      return Mail;
    case 'doc_received':
      return CheckCircle;
    case 'qbo_sync':
      return FolderSync;
    case 'coi_expiring':
      return AlertTriangle;
    case 'discount_captured':
      return DollarSign;
    default:
      return Activity;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'reminder_sent':
      return 'bg-primary';
    case 'doc_received':
      return 'bg-green-500';
    case 'qbo_sync':
      return 'bg-blue-500';
    case 'coi_expiring':
      return 'bg-amber-500';
    case 'discount_captured':
      return 'bg-emerald-500';
    default:
      return 'bg-gray-500';
  }
};

export function Timeline() {
  const { data: timelineEvents, isLoading } = useQuery({
    queryKey: ["/api/timeline"],
  });

  const { events: sseEvents, isConnected } = useSSE("/api/events");

  // Combine timeline events with SSE events
  const allEvents = [
    ...(sseEvents || []),
    ...((timelineEvents as any[]) || []).map((event: any) => ({
      ...event,
      timestamp: new Date(event.createdAt).getTime(),
      data: {
        eventType: event.eventType,
        message: event.description,
        title: event.title,
      }
    }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Live Activity Timeline</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Loading...</span>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Live Activity Timeline</h3>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className={isConnected ? 'text-green-600' : 'text-gray-500'}>
              {isConnected ? 'Live updates' : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="flow-root">
          {allEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No activity yet. Events will appear here as they happen.</p>
            </div>
          ) : (
            <ul className="-mb-8">
              {allEvents.slice(0, 10).map((event, index) => {
                const Icon = getEventIcon(event.data?.eventType || 'activity');
                const colorClass = getEventColor(event.data?.eventType || 'activity');
                const isLast = index === allEvents.length - 1;
                
                return (
                  <li key={event.timestamp + index} className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full ${colorClass} flex items-center justify-center ring-8 ring-white`}>
                          <Icon className="w-4 h-4 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {event.data?.message || event.data?.title || 'Activity event'}
                          </p>
                          {event.data?.eventType && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {event.data.eventType.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </time>
                          {event.event && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Live
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isLast && (
                      <div className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        {allEvents.length > 10 && (
          <div className="mt-6 text-center">
            <Button variant="outline" size="sm">
              Load More Events
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
