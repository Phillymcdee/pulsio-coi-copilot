import { useEffect, useState, useRef } from 'react';

export interface SSEEvent {
  event?: string;
  data: any;
  timestamp: number;
}

export function useSSE(endpoint: string) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connectSSE = () => {
      try {
        const eventSource = new EventSource(endpoint, {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('SSE connected');
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const sseEvent: SSEEvent = {
              event: event.type,
              data,
              timestamp: Date.now(),
            };
            
            setEvents(prev => [sseEvent, ...prev.slice(0, 49)]); // Keep last 50 events
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        };

        // Handle specific event types
        eventSource.addEventListener('doc.received', (event) => {
          try {
            const data = JSON.parse(event.data);
            const sseEvent: SSEEvent = {
              event: 'doc.received',
              data,
              timestamp: Date.now(),
            };
            setEvents(prev => [sseEvent, ...prev.slice(0, 49)]);
          } catch (err) {
            console.error('Error parsing doc.received event:', err);
          }
        });

        eventSource.addEventListener('reminder.sent', (event) => {
          try {
            const data = JSON.parse(event.data);
            const sseEvent: SSEEvent = {
              event: 'reminder.sent',
              data,
              timestamp: Date.now(),
            };
            setEvents(prev => [sseEvent, ...prev.slice(0, 49)]);
          } catch (err) {
            console.error('Error parsing reminder.sent event:', err);
          }
        });

        eventSource.addEventListener('qbo.sync', (event) => {
          try {
            const data = JSON.parse(event.data);
            const sseEvent: SSEEvent = {
              event: 'qbo.sync',
              data,
              timestamp: Date.now(),
            };
            setEvents(prev => [sseEvent, ...prev.slice(0, 49)]);
          } catch (err) {
            console.error('Error parsing qbo.sync event:', err);
          }
        });

        eventSource.onerror = (err) => {
          console.error('SSE error:', err);
          setIsConnected(false);
          setError('Connection lost. Reconnecting...');
          
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              connectSSE();
            }
          }, 3000);
        };

        eventSourceRef.current = eventSource;

      } catch (err) {
        console.error('Error creating SSE connection:', err);
        setError('Failed to connect to live updates');
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [endpoint]);

  const clearEvents = () => {
    setEvents([]);
  };

  return {
    events,
    isConnected,
    error,
    clearEvents,
  };
}
