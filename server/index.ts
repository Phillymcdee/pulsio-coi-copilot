import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./services/logger";
import { verifyJobberWebhook, processJobberWebhook } from "./webhooks/jobber";

const app = express();

// Security middleware - must be first
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for Vite dev mode
  crossOriginEmbedderPolicy: false // Allow cross-origin resources
}));

app.use(compression()); // Enable gzip compression

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: () => process.env.NODE_ENV === 'development'
});

app.use('/api', limiter);

// Webhook routes MUST be registered BEFORE express.json() to preserve raw body for signature verification
app.post('/webhooks/jobber', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get raw body as string for signature verification
    const rawBody = req.body.toString('utf8');
    const signature = req.headers['x-jobber-hmac-sha256'] as string;
    
    if (!signature) {
      logger.warn('Jobber webhook received without signature');
      return res.status(401).json({ message: 'Missing signature' });
    }

    // Verify webhook signature
    const isValid = verifyJobberWebhook(rawBody, signature);
    
    if (!isValid) {
      logger.error('Jobber webhook signature verification failed');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // Parse the payload
    const payload = JSON.parse(rawBody);
    
    // Respond immediately with 200 (Jobber requires response within 1 second)
    res.status(200).json({ received: true });
    
    // Process webhook asynchronously in background
    setImmediate(async () => {
      try {
        await processJobberWebhook(payload);
        logger.info('Jobber webhook processed successfully', { 
          topic: payload.data?.webHookEvent?.topic 
        });
      } catch (error) {
        logger.error('Error processing Jobber webhook in background', { 
          error: error instanceof Error ? error.message : String(error),
          topic: payload.data?.webHookEvent?.topic,
        });
      }
    });
  } catch (error) {
    logger.error('Error in Jobber webhook endpoint', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Still return 200 to prevent Jobber from retrying
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.request(req.method, path, res.statusCode, duration, {
        responseData: capturedJsonResponse && Object.keys(capturedJsonResponse).length < 10 
          ? capturedJsonResponse 
          : { summary: `${Object.keys(capturedJsonResponse || {}).length} fields` }
      });
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`Pulsio server started on port ${port}`, { 
      environment: process.env.NODE_ENV,
      host: "0.0.0.0",
      port 
    });
  });
})();
