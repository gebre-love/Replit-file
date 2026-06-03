import app from "./app";
import { startBot } from "./bot";
import { setBotState } from "./bot-state";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

const botEnabled = process.env["BOT_ENABLED"] === "true";
const botToken = process.env["TELEGRAM_BOT_TOKEN"];

if (botEnabled) {
  if (!botToken) {
    logger.error("BOT_ENABLED is true but TELEGRAM_BOT_TOKEN is not set");
    process.exit(1);
  }
  setBotState({ enabled: true });
  startBot(botToken).catch((err) => {
    logger.error({ err }, "Failed to start Telegram bot");
    process.exit(1);
  });
} else {
  setBotState({ enabled: false });
  logger.info("Bot is disabled (BOT_ENABLED=false)");
}
