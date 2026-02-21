import fs from 'node:fs';
import path from 'node:path';
import YAML from 'js-yaml';
import { getLastFlagValue } from './args';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

export interface LoggerOptions {
  level: LogLevel;
  filePath?: string;
  scope?: string;
}

interface PartialLoggerConfig {
  log_level?: unknown;
  log_file?: unknown;
  logging?: {
    level?: unknown;
    file?: unknown;
  };
}

function normalizeLevel(input: unknown): LogLevel | null {
  if (typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  if (value === 'error' || value === 'warn' || value === 'info' || value === 'debug') return value;
  return null;
}

function readConfigFile(configPath: string): PartialLoggerConfig | null {
  try {
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = YAML.load(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as PartialLoggerConfig;
  } catch {
    return null;
  }
}

export function resolveLoggerOptions(params?: {
  argv?: string[];
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}): LoggerOptions {
  const argv = params?.argv ?? process.argv.slice(2);
  const env = params?.env ?? process.env;
  const cwd = params?.cwd ?? process.cwd();
  const configPath = path.join(cwd, 'deelan.config.yml');
  const config = readConfigFile(configPath);

  const configLevel = normalizeLevel(config?.logging?.level) ?? normalizeLevel(config?.log_level);
  const envLevel = normalizeLevel(env.DEELAN_LOG_LEVEL);
  const argLevel = normalizeLevel(getLastFlagValue(argv, '--log-level'));
  const level = argLevel ?? envLevel ?? configLevel ?? 'info';

  const configFile =
    typeof config?.logging?.file === 'string'
      ? config.logging.file.trim()
      : typeof config?.log_file === 'string'
        ? config.log_file.trim()
        : '';
  const envFile = env.DEELAN_LOG_FILE?.trim() || '';
  const argFile = getLastFlagValue(argv, '--log-file')?.trim() || '';
  const filePathRaw = argFile || envFile || configFile || '';
  const filePath = filePathRaw ? path.resolve(cwd, filePathRaw) : undefined;

  return { level, filePath };
}

export class Logger {
  private readonly level: LogLevel;
  private readonly filePath?: string;
  private readonly scope?: string;

  constructor(options: LoggerOptions) {
    this.level = options.level;
    this.filePath = options.filePath;
    this.scope = options.scope;
  }

  error(message: string): void {
    this.write('error', message);
  }

  warn(message: string): void {
    this.write('warn', message);
  }

  info(message: string): void {
    this.write('info', message);
  }

  debug(message: string): void {
    this.write('debug', message);
  }

  private write(level: LogLevel, message: string): void {
    if (LOG_LEVEL_WEIGHT[level] > LOG_LEVEL_WEIGHT[this.level]) return;

    const ts = new Date().toISOString();
    const scopePrefix = this.scope ? `${this.scope} ` : '';
    const line = `[${ts}] ${level.toUpperCase()} ${scopePrefix}${message}`;

    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);

    if (!this.filePath) return;
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.appendFileSync(this.filePath, `${line}\n`, 'utf8');
    } catch {
      // Logging should never crash the main process.
    }
  }
}

export function createLogger(scope?: string, params?: { argv?: string[]; env?: NodeJS.ProcessEnv; cwd?: string }): Logger {
  const base = resolveLoggerOptions(params);
  return new Logger({ ...base, scope });
}
