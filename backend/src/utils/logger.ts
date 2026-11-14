import path from "path";
import winston from "winston";
import { env, isProduction } from "../config/env";

const logsDir = path.join(process.cwd(), "logs");

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}] ${message}${metaStr}`;
  }),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    // Bounded so a long-running PM2 process can't fill the EC2 disk —
    // 10MB per file, 5 rotated files kept (50MB cap per log).
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

if (!isProduction) {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
} else {
  // PM2 captures whatever a process writes to stdout into its own
  // out.log — without this, `pm2 logs` shows nothing and a CloudWatch
  // Logs agent tailing PM2's log directory has nothing to ship. JSON here
  // (not the colorized dev format) so it stays machine-parseable.
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  );
}

export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
