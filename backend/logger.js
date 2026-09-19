// logger.js
// File + console logger. Every server start opens a fresh file in backend/logs/
// named like D19_09_2026_T15_38_32_321.log (local time, day-first).

const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("util");

const LOGS_DIR = path.join(__dirname, "logs");

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };
const MIN_LEVEL = LEVELS[(process.env.LOG_LEVEL || "info").toLowerCase()] ?? LEVELS.info;

const pad = (n, width = 2) => String(n).padStart(width, "0");

function fileStamp(d = new Date()) {
    return (
        `D${pad(d.getDate())}_${pad(d.getMonth() + 1)}_${d.getFullYear()}` +
        `_T${pad(d.getHours())}_${pad(d.getMinutes())}_${pad(d.getSeconds())}_${pad(d.getMilliseconds(), 3)}`
    );
}

function lineStamp(d = new Date()) {
    const offset = -d.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const tz = `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)} ${tz}`
    );
}

function serialize(value) {
    if (value instanceof Error) {
        return value.stack || `${value.name}: ${value.message}`;
    }
    if (typeof value === "string") return value;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

fs.mkdirSync(LOGS_DIR, { recursive: true });

const LOG_FILE = path.join(LOGS_DIR, `${fileStamp()}.log`);
const stream = fs.createWriteStream(LOG_FILE, { flags: "a", encoding: "utf8" });

stream.on("error", (err) => {
    // Never let a logging failure take the server down.
    process.stderr.write(`[logger] failed to write ${LOG_FILE}: ${err.message}\n`);
});

function write(level, message, meta) {
    if (LEVELS[level] < MIN_LEVEL) return;

    let line = `[${lineStamp()}] [${level.toUpperCase().padEnd(5)}] [pid:${process.pid}] ${serialize(message)}`;
    if (meta !== undefined) line += ` | ${serialize(meta)}`;

    stream.write(line + os.EOL);

    const out = LEVELS[level] >= LEVELS.warn ? process.stderr : process.stdout;
    out.write(line + "\n");
}

const logger = {
    debug: (msg, meta) => write("debug", msg, meta),
    info: (msg, meta) => write("info", msg, meta),
    warn: (msg, meta) => write("warn", msg, meta),
    error: (msg, meta) => write("error", msg, meta),
    fatal: (msg, meta) => write("fatal", msg, meta),

    // Flush pending writes before the process exits.
    close: () => new Promise((resolve) => stream.end(resolve)),
};

/**
 * Express middleware: one line per finished request with status and duration.
 */
function requestLogger(req, res, next) {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
        write(level, `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`, {
            ip: req.ip,
            ua: req.get("user-agent"),
        });
    });

    next();
}

/**
 * Log startup context, route console.* into the log file and hook
 * process-level failures/shutdown signals.
 */
function installProcessHandlers() {
    // Existing console.* calls end up in the log file too.
    const fmt = (args) => util.format(...args);
    console.log = (...args) => write("info", fmt(args));
    console.info = (...args) => write("info", fmt(args));
    console.debug = (...args) => write("debug", fmt(args));
    console.warn = (...args) => write("warn", fmt(args));
    console.error = (...args) => write("error", fmt(args));

    logger.info("Logger initialised", {
        file: LOG_FILE,
        node: process.version,
        platform: `${process.platform}/${process.arch}`,
        env: process.env.NODE_ENV || "development",
        logLevel: Object.keys(LEVELS).find((k) => LEVELS[k] === MIN_LEVEL),
    });

    process.on("uncaughtException", async (err) => {
        logger.fatal("Uncaught exception", err);
        await logger.close();
        process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
        logger.error("Unhandled promise rejection", reason);
    });

    // SIGUSR2 is what nodemon sends on restart (POSIX only).
    const signals = ["SIGINT", "SIGTERM"];
    if (process.platform !== "win32") signals.push("SIGUSR2");
    for (const signal of signals) {
        process.once(signal, async () => {
            logger.info(`Received ${signal}, shutting down`);
            await logger.close();
            // nodemon expects the process to die from SIGUSR2 itself.
            if (signal === "SIGUSR2") process.kill(process.pid, "SIGUSR2");
            else process.exit(0);
        });
    }
}

module.exports = { logger, requestLogger, installProcessHandlers, LOG_FILE, LOGS_DIR };
