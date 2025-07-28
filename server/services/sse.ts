import { EventEmitter } from 'events';
import type { Response } from 'express';

// Global event bus for SSE
export const eventBus = new EventEmitter();

export interface SSEEvent {
  event?: string;
  data: any;
  id?: string;
}

export class SSEService {
  private clients = new Map<string, Response>();

  addClient(accountId: string, res: Response): void {
    this.clients.set(accountId, res);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection event
    this.sendToClient(accountId, {
      event: 'connected',
      data: { message: 'Connected to live updates', timestamp: Date.now() },
    });

    // Clean up on client disconnect
    res.on('close', () => {
      this.clients.delete(accountId);
    });
  }

  sendToClient(accountId: string, event: SSEEvent): void {
    const client = this.clients.get(accountId);
    if (!client) return;

    try {
      let message = '';
      
      if (event.id) {
        message += `id: ${event.id}\n`;
      }
      
      if (event.event) {
        message += `event: ${event.event}\n`;
      }
      
      message += `data: ${JSON.stringify(event.data)}\n\n`;
      
      client.write(message);
    } catch (error) {
      console.error('Error sending SSE message:', error);
      this.clients.delete(accountId);
    }
  }

  broadcast(event: SSEEvent): void {
    for (const accountId of this.clients.keys()) {
      this.sendToClient(accountId, event);
    }
  }

  sendDocumentReceived(accountId: string, vendorName: string, docType: 'W9' | 'COI'): void {
    this.sendToClient(accountId, {
      event: 'doc.received',
      data: {
        eventType: 'doc_received',
        vendorName,
        docType,
        message: `${vendorName} uploaded ${docType}. Payment unlocked.`,
        timestamp: Date.now(),
      },
    });
  }

  sendReminderSent(accountId: string, vendorName: string, docType: 'W9' | 'COI', channel: 'email' | 'sms'): void {
    this.sendToClient(accountId, {
      event: 'reminder.sent',
      data: {
        eventType: 'reminder_sent',
        vendorName,
        docType,
        channel,
        message: `Reminder sent to ${vendorName} for ${docType} document`,
        timestamp: Date.now(),
      },
    });
  }

  sendQBOSync(accountId: string, vendorCount: number): void {
    this.sendToClient(accountId, {
      event: 'qbo.sync',
      data: {
        eventType: 'qbo_sync',
        vendorCount,
        message: `QuickBooks sync completed - ${vendorCount} vendors updated`,
        timestamp: Date.now(),
      },
    });
  }

  sendDiscountCaptured(accountId: string, vendorName: string, amount: number): void {
    this.sendToClient(accountId, {
      event: 'discount.captured',
      data: {
        eventType: 'discount_captured',
        vendorName,
        amount,
        message: `$${amount} discount secured from ${vendorName}. High-five!`,
        timestamp: Date.now(),
      },
    });
  }

  sendCOIExpiring(accountId: string, vendorName: string, daysUntilExpiry: number): void {
    this.sendToClient(accountId, {
      event: 'coi.expiring',
      data: {
        eventType: 'coi_expiring',
        vendorName,
        daysUntilExpiry,
        message: `${vendorName}'s COI expires in ${daysUntilExpiry} days—we're on it.`,
        timestamp: Date.now(),
      },
    });
  }

  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }
}

export const sseService = new SSEService();

// Set up event bus listeners
eventBus.on('doc.received', ({ accountId, vendorName, docType }) => {
  sseService.sendDocumentReceived(accountId, vendorName, docType);
});

eventBus.on('reminder.sent', ({ accountId, vendorName, docType, channel }) => {
  sseService.sendReminderSent(accountId, vendorName, docType, channel);
});

eventBus.on('qbo.sync', ({ accountId, vendorCount }) => {
  sseService.sendQBOSync(accountId, vendorCount);
});

eventBus.on('discount.captured', ({ accountId, vendorName, amount }) => {
  sseService.sendDiscountCaptured(accountId, vendorName, amount);
});

eventBus.on('coi.expiring', ({ accountId, vendorName, daysUntilExpiry }) => {
  sseService.sendCOIExpiring(accountId, vendorName, daysUntilExpiry);
});
