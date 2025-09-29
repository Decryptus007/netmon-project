import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
class Logger {
    logDir;
    logStream;
    errorStream;
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
        const currentDate = format(new Date(), 'yyyy-MM-dd');
        this.logStream = fs.createWriteStream(path.join(this.logDir, `${currentDate}.log`), { flags: 'a' });
        this.errorStream = fs.createWriteStream(path.join(this.logDir, `${currentDate}-error.log`), { flags: 'a' });
    }
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    formatLog(level, message, meta) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(meta && { meta })
        };
    }
    writeLog(entry) {
        const logString = JSON.stringify(entry) + '\n';
        const colors = {
            info: '\x1b[32m',
            warn: '\x1b[33m',
            error: '\x1b[31m',
            debug: '\x1b[36m'
        };
        console.log(`${colors[entry.level]}[${entry.level.toUpperCase()}]\x1b[0m`, `[${entry.timestamp}]`, entry.message, entry.meta || '');
        this.logStream.write(logString);
        if (entry.level === 'error') {
            this.errorStream.write(logString);
        }
    }
    info(message, meta) {
        this.writeLog(this.formatLog('info', message, meta));
    }
    warn(message, meta) {
        this.writeLog(this.formatLog('warn', message, meta));
    }
    error(message, meta) {
        this.writeLog(this.formatLog('error', message, meta));
    }
    debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            this.writeLog(this.formatLog('debug', message, meta));
        }
    }
    logRequest(req, res, responseTime) {
        const meta = {
            method: req.method,
            url: req.originalUrl || req.url,
            ip: req.ip,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userAgent: req.get('user-agent'),
            ...(req.user && { userId: req.user.id })
        };
        this.info(`${req.method} ${req.originalUrl || req.url}`, meta);
    }
    logError(error, req) {
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
//# sourceMappingURL=logger.js.map