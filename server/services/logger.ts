/**
 * Production-ready logging service for Pulsio
 * Replaces console.log statements with structured logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  accountId?: string;
  requestId?: string;
}

class Logger {
  private level: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.level = this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level > this.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level].toLowerCase(),
      message: this.sanitizeMessage(message),
      ...(context && { context: this.sanitizeContext(context) })
    };

    if (this.isProduction) {
      // In production, use structured JSON logging
      console.log(JSON.stringify(entry));
    } else {
      // In development, use readable format
      const levelColors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[37m'  // White
      };
      
      const color = levelColors[level] || '\x1b[37m';
      const reset = '\x1b[0m';
      
      console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`);
      if (context) {
        console.log(`${color}Context:${reset}`, context);
      }
    }
  }

  private sanitizeMessage(message: string): string {
    // Remove sensitive data patterns
    return message
      .replace(/password[^&\s]*/gi, 'password=***')
      .replace(/token[^&\s]*/gi, 'token=***')
      .replace(/key[^&\s]*/gi, 'key=***')
      .replace(/secret[^&\s]*/gi, 'secret=***');
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    }
    
    return sanitized;
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Request-specific logging
  request(method: string, path: string, statusCode: number, duration: number, context?: Record<string, any>): void {
    this.info(`${method} ${path} ${statusCode} in ${duration}ms`, context);
  }

  // Authentication logging
  auth(event: string, userId?: string, context?: Record<string, any>): void {
    this.info(`Auth: ${event}`, { userId, ...context });
  }

  // QuickBooks sync logging
  qbo(event: string, accountId: string, context?: Record<string, any>): void {
    this.info(`QBO: ${event}`, { accountId, ...context });
  }

  // Document processing logging
  document(event: string, documentId: string, vendorId: string, context?: Record<string, any>): void {
    this.info(`Document: ${event}`, { documentId, vendorId, ...context });
  }

  // Cron job logging
  cron(jobName: string, status: 'started' | 'completed' | 'failed', context?: Record<string, any>): void {
    this.info(`Cron ${jobName}: ${status}`, context);
  }
}

export const logger = new Logger();