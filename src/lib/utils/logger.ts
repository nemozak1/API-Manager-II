/**
 * Logger utility for API Manager II
 * Provides structured logging with different levels and component identification
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
	level: LogLevel;
	enableColors: boolean;
	enableTimestamps: boolean;
}

class Logger {
	private componentName: string;
	private config: LoggerConfig;

	constructor(componentName: string, config?: Partial<LoggerConfig>) {
		this.componentName = componentName;
		this.config = {
			level: 'info',
			enableColors: true,
			enableTimestamps: true,
			...config
		};
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: Record<LogLevel, number> = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3
		};

		return levels[level] >= levels[this.config.level];
	}

	private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
		const timestamp = this.config.enableTimestamps 
			? `[${new Date().toISOString()}]` 
			: '';
		
		const levelStr = `[${level.toUpperCase()}]`;
		const component = `[${this.componentName}]`;
		
		let formattedMessage = `${timestamp} ${levelStr} ${component} ${message}`;
		
		if (args.length > 0) {
			formattedMessage += ' ' + args.map(arg => 
				typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
			).join(' ');
		}
		
		return formattedMessage;
	}

	private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
		switch (level) {
			case 'debug':
				return console.debug;
			case 'info':
				return console.info;
			case 'warn':
				return console.warn;
			case 'error':
				return console.error;
			default:
				return console.log;
		}
	}

	private applyColors(level: LogLevel, message: string): string {
		if (!this.config.enableColors) {
			return message;
		}

		const colors = {
			debug: '\x1b[36m', // Cyan
			info: '\x1b[32m',  // Green
			warn: '\x1b[33m',  // Yellow
			error: '\x1b[31m', // Red
			reset: '\x1b[0m'   // Reset
		};

		return `${colors[level]}${message}${colors.reset}`;
	}

	private log(level: LogLevel, message: string, ...args: any[]): void {
		if (!this.shouldLog(level)) {
			return;
		}

		const formattedMessage = this.formatMessage(level, message, ...args);
		const coloredMessage = this.applyColors(level, formattedMessage);
		
		this.getConsoleMethod(level)(coloredMessage);
	}

	debug(message: string, ...args: any[]): void {
		this.log('debug', message, ...args);
	}

	info(message: string, ...args: any[]): void {
		this.log('info', message, ...args);
	}

	warn(message: string, ...args: any[]): void {
		this.log('warn', message, ...args);
	}

	error(message: string, ...args: any[]): void {
		this.log('error', message, ...args);
	}

	/**
	 * Create a child logger with the same configuration but a different component name
	 */
	child(childComponentName: string): Logger {
		return new Logger(`${this.componentName}:${childComponentName}`, this.config);
	}

	/**
	 * Update logger configuration
	 */
	setConfig(config: Partial<LoggerConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

/**
 * Create a new logger instance for a specific component
 * @param componentName - Name of the component using the logger
 * @param config - Optional logger configuration
 * @returns Logger instance
 */
export function createLogger(componentName: string, config?: Partial<LoggerConfig>): Logger {
	return new Logger(componentName, config);
}

/**
 * Global logger configuration
 */
export const globalLoggerConfig: LoggerConfig = {
	level: (process.env.NODE_ENV === 'development' ? 'debug' : 'info') as LogLevel,
	enableColors: process.env.NODE_ENV === 'development',
	enableTimestamps: true
};

/**
 * Set global logger configuration that applies to all new loggers
 */
export function setGlobalLoggerConfig(config: Partial<LoggerConfig>): void {
	Object.assign(globalLoggerConfig, config);
}

/**
 * Default logger instance for general use
 */
export const logger = createLogger('APIManagerII', globalLoggerConfig);