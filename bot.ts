import { Telegraf, Markup } from "telegraf";
import { logger } from "./lib/logger";
import { setBotState } from "./bot-state";
import {
  flows,
  SELLER_ACTIONS,
  getSession,
  setSession,
  clearSession,
} from "./bot-sessions";
import { db, listingsTable } from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";

function escMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

const MANAGE_IN_STOCK = "✅ አለ";
const MANAGE_OUT_OF_STOCK = "❌ የለም";
const MANAGE_UPDATE_PRICE = "💰 የዋጋ ማሻሻያ";
const MANAGE_NEW_LISTING = "📝 አዲስ ምዝገባ";
const MANAGE_BACK = "⬅️ ዋናው ሜኑ";

const mainMenu = Markup.keyboard([
  ["🚚 የጭነት መኪና ለማከራየት", "🧱 ሲሚንቶ ለመግዛት"],
  ["🔹 ማሽን ለመከራየት", "🧱 ሲሚንቶ ለመሸጥ"],
  ["🔹 ማሽን ለመሸጥ", "🟥 ብረት ለመግዛት"],
  ["🟥 ብረት ለመሸጥ", "እንጃ ለማግኘት"],
]).resize();

const sellerMenu = Markup.keyboard([
  [MANAGE_IN_STOCK, MANAGE_OUT_OF_STOCK],
  [MANAGE_UPDATE_PRICE],
  [MANAGE_NEW_LISTING, MANAGE_BACK],
]).resize();

const cancelMenu = Markup.keyboard([["❌ ሰርዝ"]]).resize();

function summaryText(action: string, data: Record<string, string>): string {
  const lines = [`✅ ምዝገባዎ ተቀብሏል!\n`, `📋 *${action}*\n`];
  if (data.description) lines.push(`🔹 ዝርዝር: ${data.description}`);
  if (data.quantity) lines.push(`📦 መጠን: ${data.quantity}`);
  if (data.price) lines.push(`💰 ዋጋ: ${data.price}`);
  if (data.location) lines.push(`📍 ቦታ: ${data.location}`);
  if (data.phone) lines.push(`📞 ስልክ: ${data.phone}`);
  if (data.name) lines.push(`👤 ስም: ${data.name}`);
  lines.push(`\nብዙ ሰዎች ይህን ማስታወቂያ ያዩታል። ቶሎ ያዛምዳሉ!`);
  return lines.join("\n");
}

export function createBot(token: string): Telegraf {
  const bot = new Telegraf(token);

  // ── /start ──────────────────────────────────────────────────────────────
  bot.start((ctx) => {
    clearSession(ctx.chat.id);
    return ctx.reply(
      "እንኳን ወደ ድለላ አገልግሎታችን በደህና መጡ! 🎉\nየሚፈልጉትን ይምረጡ:",
      mainMenu,
    );
  });

  // ── Cancel ──────────────────────────────────────────────────────────────
  bot.hears("❌ ሰርዝ", (ctx) => {
    clearSession(ctx.chat.id);
    return ctx.reply("ተሰርዟል። ዋናው ሜኑ ላይ ተመለሱ:", mainMenu);
  });

  // ── Seller management sub-menu buttons ──────────────────────────────────

  bot.hears(MANAGE_BACK, (ctx) => {
    clearSession(ctx.chat.id);
    return ctx.reply("ዋናው ሜኑ:", mainMenu);
  });

  bot.hears(MANAGE_IN_STOCK, async (ctx) => {
    const session = getSession(ctx.chat.id);
    if (!session || session.mode !== "manage") {
      return ctx.reply("ዋናው ሜኑ ላይ ይምረጡ:", mainMenu);
    }
    try {
      const updated = await db
        .update(listingsTable)
        .set({ status: "active" })
        .where(
          and(
            eq(listingsTable.chatId, String(ctx.chat.id)),
            eq(listingsTable.action, session.action),
          ),
        )
        .returning({ id: listingsTable.id });

      if (updated.length === 0) {
        return ctx.reply(
          "⚠️ ምዝገባ አልተገኘም። ቀድሞ ምዝገባ ያስፈልጋል። \"📝 አዲስ ምዝገባ\" ይጫኑ።",
          sellerMenu,
        );
      }
      return ctx.reply("✅ ሁኔታዎ ወደ «አለ» ተቀይሯል!", sellerMenu);
    } catch (err) {
      logger.error({ err }, "Failed to update status");
      return ctx.reply("⚠️ ሲቀይር ስህተት ተፈጠረ። እንደገና ይሞክሩ።", sellerMenu);
    }
  });

  bot.hears(MANAGE_OUT_OF_STOCK, async (ctx) => {
    const session = getSession(ctx.chat.id);
    if (!session || session.mode !== "manage") {
      return ctx.reply("ዋናው ሜኑ ላይ ይምረጡ:", mainMenu);
    }
    try {
      const updated = await db
        .update(listingsTable)
        .set({ status: "inactive" })
        .where(
          and(
            eq(listingsTable.chatId, String(ctx.chat.id)),
            eq(listingsTable.action, session.action),
          ),
        )
        .returning({ id: listingsTable.id });

      if (updated.length === 0) {
        return ctx.reply(
          "⚠️ ምዝገባ አልተገኘም። ቀድሞ ምዝገባ ያስፈልጋል። \"📝 አዲስ ምዝገባ\" ይጫኑ።",
          sellerMenu,
        );
      }
      return ctx.reply("❌ ሁኔታዎ ወደ «የለም» ተቀይሯል!", sellerMenu);
    } catch (err) {
      logger.error({ err }, "Failed to update status");
      return ctx.reply("⚠️ ሲቀይር ስህተት ተፈጠረ። እንደገና ይሞክሩ።", sellerMenu);
    }
  });

  bot.hears(MANAGE_UPDATE_PRICE, (ctx) => {
    const session = getSession(ctx.chat.id);
    if (!session || session.mode !== "manage") {
      return ctx.reply("ዋናው ሜኑ ላይ ይምረጡ:", mainMenu);
    }
    setSession(ctx.chat.id, { mode: "price-update", action: session.action });
    return ctx.reply(
      "💰 አዲስ ዋጋ ያስፈልጋል:\n(ለምሳሌ: 2500 ብር)",
      cancelMenu,
    );
  });

  bot.hears(MANAGE_NEW_LISTING, (ctx) => {
    const session = getSession(ctx.chat.id);
    if (!session || session.mode !== "manage") {
      return ctx.reply("ዋናው ሜኑ ላይ ይምረጡ:", mainMenu);
    }
    const flow = flows[session.action];
    if (!flow) return;
    setSession(ctx.chat.id, {
      mode: "flow",
      action: session.action,
      step: 0,
      data: {},
    });
    return ctx.reply(flow!.question, cancelMenu);
  });

  // ── Main menu items ──────────────────────────────────────────────────────
  for (const action of Object.keys(flows)) {
    bot.hears(action, (ctx) => {
      clearSession(ctx.chat.id);
      if (SELLER_ACTIONS.has(action)) {
        setSession(ctx.chat.id, { mode: "manage", action });
        return ctx.reply(
          `📦 *${action}*\nምን ማድረግ ይፈልጋሉ?`,
          { parse_mode: "Markdown", ...sellerMenu },
        );
      }
      const flow = flows[action]!;
      setSession(ctx.chat.id, { mode: "flow", action, step: 0, data: {} });
      return ctx.reply(flow!.question, cancelMenu);
    });
  }

  // ── Text handler (flow steps + price update) ─────────────────────────────
  bot.on("text", async (ctx) => {
    const session = getSession(ctx.chat.id);

    if (!session) {
      return ctx.reply("ዋናው ሜኑ ላይ ይምረጡ 👇", mainMenu);
    }

    // Price update mode — next text is the new price
    if (session.mode === "price-update") {
      const newPrice = ctx.message.text;
      const action = session.action;
      try {
        const updated = await db
          .update(listingsTable)
          .set({ price: newPrice })
          .where(
            and(
              eq(listingsTable.chatId, String(ctx.chat.id)),
              eq(listingsTable.action, action),
            ),
          )
          .returning({ id: listingsTable.id });

        setSession(ctx.chat.id, { mode: "manage", action });

        if (updated.length === 0) {
          return ctx.reply(
            "⚠️ ምዝገባ አልተገኘም። ቀድሞ ምዝገባ ያስፈልጋል። \"📝 አዲስ ምዝገባ\" ይጫኑ።",
            sellerMenu,
          );
        }
        return ctx.reply(`✅ ዋጋ ወደ «${newPrice}» ተቀይሯል!`, sellerMenu);
      } catch (err) {
        logger.error({ err }, "Failed to update price");
        setSession(ctx.chat.id, { mode: "manage", action });
        return ctx.reply("⚠️ ዋጋ ሲቀይር ስህተት ተፈጠረ።", sellerMenu);
      }
    }

    // Listing creation flow
    if (session.mode === "flow") {
      const flow = flows[session.action];
      if (!flow) return ctx.reply("ዋናው ሜኑ ላይ ይምረጡ 👇", mainMenu);

      const currentStep = flow[session.step];
      if (!currentStep) return ctx.reply("ዋናው ሜኑ ላይ ይምረጡ 👇", mainMenu);

      session.data[currentStep.key] = ctx.message.text;
      const nextStep = session.step + 1;

      if (nextStep < flow.length) {
        session.step = nextStep;
        setSession(ctx.chat.id, session);
        return ctx.reply(flow[nextStep]!.question);
      }

      clearSession(ctx.chat.id);

      try {
        await db.insert(listingsTable).values({
          action: session.action,
          name: session.data.name ?? "",
          phone: session.data.phone ?? "",
          location: session.data.location ?? "",
          description: session.data.description ?? null,
          quantity: session.data.quantity ?? null,
          price: session.data.price ?? null,
          status: "active",
          chatId: String(ctx.chat.id),
        });

        return ctx.reply(
          summaryText(session.action, session.data as Record<string, string>),
          { parse_mode: "Markdown", ...mainMenu },
        );
      } catch (err) {
        logger.error({ err }, "Failed to save listing");
        return ctx.reply(
          "⚠️ ምዝገባ ሲቀመጥ ስህተት ተፈጠረ። እባክዎ እንደገና ይሞክሩ።",
          mainMenu,
        );
      }
    }

    return ctx.reply("ዋናው ሜኑ ላይ ይምረጡ 👇", mainMenu);
  });

  // ── /help ────────────────────────────────────────────────────────────────
  bot.help((ctx) => {
    clearSession(ctx.chat.id);
    return ctx.reply("ዋናውን ሜኑ ለማየት /start ይጫኑ።", mainMenu);
  });

  // ── /listings (admin) ────────────────────────────────────────────────────
  bot.command("listings", async (ctx) => {
    const adminChatId = process.env["ADMIN_CHAT_ID"];
    if (adminChatId && String(ctx.chat.id) !== adminChatId) {
      return ctx.reply("⛔ ይህ ትዕዛዝ ለአስተዳዳሪ ብቻ ነው።");
    }

    try {
      const rows = await db
        .select()
        .from(listingsTable)
        .orderBy(desc(listingsTable.createdAt))
        .limit(10);

      if (rows.length === 0) {
        return ctx.reply("📭 እስካሁን ምንም ምዝገባ የለም።");
      }

      const lines: string[] = [`📋 *የቅርብ ጊዜ ምዝገቦች* (${rows.length})\n`];
      for (const [i, row] of rows.entries()) {
        const date = row.createdAt.toLocaleDateString("am-ET", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const statusIcon = row.status === "active" ? "🟢" : "🔴";
        lines.push(`*${i + 1}\\. ${escMd(row.action)}* ${statusIcon}`);
        if (row.description) lines.push(`🔹 ${escMd(row.description)}`);
        if (row.quantity) lines.push(`📦 ${escMd(row.quantity)}`);
        if (row.price) lines.push(`💰 ${escMd(row.price)}`);
        lines.push(`📍 ${escMd(row.location)}`);
        lines.push(`📞 ${escMd(row.phone)} · 👤 ${escMd(row.name)}`);
        lines.push(`🕐 ${escMd(date)}\n`);
      }

      return ctx.reply(lines.join("\n"), { parse_mode: "MarkdownV2" });
    } catch (err) {
      logger.error({ err }, "Failed to fetch listings");
      return ctx.reply("⚠️ ምዝገቦችን ሲያመጣ ስህተት ተፈጠረ።");
    }
  });

  bot.catch((err, ctx) => {
    logger.error({ err, updateType: ctx.updateType }, "Bot error");
  });

  return bot;
}

export async function startBot(token: string): Promise<Telegraf> {
  const bot = createBot(token);

  const me = await bot.telegram.getMe();
  setBotState({ connected: true, username: me.username, id: me.id });
  logger.info(
    { username: me.username, id: me.id, name: me.first_name },
    "Telegram bot connected — starting polling",
  );

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  bot.launch().catch((err) => {
    setBotState({ connected: false });
    logger.error({ err }, "Bot polling error");
  });

  return bot;
}
