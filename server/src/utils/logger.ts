import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

class Logger {
  private logDir: string;
  private logStream: fs.WriteStream;
  private errorStream: fs.WriteStream;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    this.logStream = fs.createWriteStream(
      path.join(this.logDir, `${currentDate}.log`),
      { flags: 'a' }
    );
    this.errorStream = fs.createWriteStream(
      path.join(this.logDir, `${currentDate}-error.log`),
      { flags: 'a' }
    );
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLog(level: LogLevel, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta })
    };
  }

  private writeLog(entry: LogEntry) {
    const logString = JSON.stringify(entry) + '\n';
    
    // Write to console with color
    const colors = {
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      debug: '\x1b[36m'  // Cyan
    };
    
    console.log(
      `${colors[entry.level]}[${entry.level.toUpperCase()}]\x1b[0m`,
      `[${entry.timestamp}]`,
      entry.message,
      entry.meta || ''
    );

    // Write to file
    this.logStream.write(logString);
    
    // Also write errors to error log
    if (entry.level === 'error') {
      this.errorStream.write(logString);
    }
  }

  info(message: string, meta?: any) {
    this.writeLog(this.formatLog('info', message, meta));
  }

  warn(message: string, meta?: any) {
    this.writeLog(this.formatLog('warn', message, meta));
  }

  error(message: string, meta?: any) {
    this.writeLog(this.formatLog('error', message, meta));
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog(this.formatLog('debug', message, meta));
    }
  }

  // Request logging
  logRequest(req: any, res: any, responseTime: number) {
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('user-agent'),
      ...(req.user && { userId: req.user.id }) // If you have authentication
    };

    this.info(`${req.method} ${req.originalUrl || req.url}`, meta);
  }

  // Error logging
  logError(error: Error, req?: any) {
    const meta = {
      stack: error.stack,
      ...(req && {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.body,
        query: req.query,
        params: req.params
      })
    };

    this.error(error.message, meta);
  }
}

export const logger = new Logger(); 