import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();
register.setDefaultLabels({ app: 'chathub-backend' });

// Collect Node.js default metrics (event loop lag, memory, GC, etc.)
collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeSocketConnections = new Gauge({
  name: 'socket_connections_active',
  help: 'Number of active Socket.io connections',
  registers: [register],
});

export const socketEventsTotal = new Counter({
  name: 'socket_events_total',
  help: 'Total number of Socket.io events processed',
  labelNames: ['event'],
  registers: [register],
});

export const messagesTotal = new Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['type'],
  registers: [register],
});
