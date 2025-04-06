// src/utils/logger.ts

// 日誌級別
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

// 日誌選項
export interface LoggerOptions {
    level?: LogLevel;
    prefix?: string;
    timestamp?: boolean;
    colors?: boolean;
}

// 簡化的顏色代碼
const colors = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

/**
 * 建立日誌記錄器
 * @param options 日誌選項
 * @returns 日誌記錄器物件
 */
export function createLogger(options: LoggerOptions = {}) {
    const {
        level = LogLevel.INFO,
        prefix = 'BunServe',
        timestamp = true,
        colors: useColors = true
    } = options;

    const prefixStr = `[${prefix}]`;

    function formatMessage(levelName: string, message: string, levelColor: string): string {
        const timeStr = timestamp ? `${colors.dim}${new Date().toISOString()}${colors.reset} ` : '';
        const levelStr = useColors ? `${levelColor}[${levelName}]${colors.reset}` : `[${levelName}]`;
        return `${timeStr}${levelStr} ${prefixStr} ${message}`;
    }

    function logMessage(levelName: string, levelColor: string, message: string, ...args: any[]) {
        console.log(formatMessage(levelName, message, levelColor), ...args);
    }

    return {
        setLevel(newLevel: LogLevel) {
            options.level = newLevel;
        },

        debug(message: string, ...args: any[]) {
            if (level <= LogLevel.DEBUG) {
                logMessage('DEBUG', colors.cyan, message, ...args);
            }
        },

        info(message: string, ...args: any[]) {
            if (level <= LogLevel.INFO) {
                logMessage('INFO', colors.green, message, ...args);
            }
        },

        warn(message: string, ...args: any[]) {
            if (level <= LogLevel.WARN) {
                logMessage('WARN', colors.yellow, message, ...args);
            }
        },

        error(message: string, ...args: any[]) {
            if (level <= LogLevel.ERROR) {
                logMessage('ERROR', colors.red, message, ...args);
            }
        },

        request(req: Request, res: Response, startTime: number) {
            if (level <= LogLevel.INFO) {
                const duration = Date.now() - startTime;
                const url = new URL(req.url);
                const path = url.pathname;
                const status = res.status;
                const statusColor = status >= 500 ? colors.red : status >= 400 ? colors.yellow : colors.green;
                const message = `${req.method} ${path} ${status} ${duration}ms`;
                logMessage('HTTP', colors.cyan, message);
            }
        }
    };
}

// 預設日誌記錄器
export const logger = createLogger();