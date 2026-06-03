export type FlowStep = {
  key: "name" | "phone" | "location" | "description" | "quantity" | "price";
  question: string;
};

export type FlowSession = {
  mode: "flow";
  action: string;
  step: number;
  data: Partial<Record<FlowStep["key"], string>>;
};

export type ManageSession = {
  mode: "manage";
  action: string;
};

export type PriceUpdateSession = {
  mode: "price-update";
  action: string;
};

export type Session = FlowSession | ManageSession | PriceUpdateSession;

export const SELLER_ACTIONS = new Set([
  "🧱 ሲሚንቶ ለመሸጥ",
  "🔹 ማሽን ለመሸጥ",
  "🟥 ብረት ለመሸጥ",
]);

export const flows: Record<string, FlowStep[]> = {
  "🚚 የጭነት መኪና ለማከራየት": [
    { key: "description", question: "🚚 የመኪናውን ዓይነትና ጭነት አቅም ይግለጹ:\n(ለምሳሌ: 10 ቶን ቲፐር)" },
    { key: "location", question: "📍 ከየት ወደ የት ያጓጓዛሉ?\n(መነሻ ቦታ ወይም ዋናው አካባቢ)" },
    { key: "price", question: "💰 ዋጋ (በቀን ወይም በጉዞ):" },
    { key: "phone", question: "📞 ስልክ ቁጥርዎ:" },
    { key: "name", question: "👤 ሙሉ ስምዎ:" },
  ],
  "🧱 ሲሚንቶ ለመሸጥ": [
    { key: "quantity", question: "🧱 ምን ያህል ኩንታል ሲሚንቶ አለዎት?" },
    { key: "price", question: "💰 የአንድ ኩንታል ዋጋ ስንት ነው?" },
    { key: "location", question: "📍 ሲሚንቶው የሚገኝበት ቦታ:" },
    { key: "phone", question: "📞 ስልክ ቁጥርዎ:" },
    { key: "name", question: "👤 ሙሉ ስምዎ:" },
  ],
  "🔹 ማሽን ለመሸጥ": [
    { key: "description", question: "🔹 ማሽኑን ዓይነትና ሁኔታ ይግለጹ:\n(ሞዴልና ዕድሜ ጭምር)" },
    { key: "price", question: "💰 የሚሸጡበት ዋጋ:" },
    { key: "location", question: "📍 ማሽኑ የሚገኝበት ቦታ:" },
    { key: "phone", question: "📞 ስልክ ቁጥርዎ:" },
    { key: "name", question: "👤 ሙሉ ስምዎ:" },
  ],
  "🟥 ብረት ለመሸጥ": [
    { key: "description", question: "🟥 የብረቱ ዓይነትና መጠን ይግለጹ:\n(ለምሳሌ: 12mm ሰቀላ፣ 50 ኩንታል)" },
    { key: "price", question: "💰 ዋጋ (በኩንታል ወይም አጠቃላይ):" },
    { key: "location", question: "📍 ብረቱ የሚገኝበት ቦታ:" },
    { key: "phone", question: "📞 ስልክ ቁጥርዎ:" },
    { key: "name", question: "👤 ሙሉ ስምዎ:" },
  ],
  "🧱 ሲሚንቶ ለመግዛት": [
    { key: "quantity", question: "🧱 ምን ያህል ኩንታል ሲሚንቶ ይፈልጋሉ?" },
    { key: "location", question: "📍 ሲሚንቶ የሚፈልጉበት ቦታ:\n(ለፍለጋ ይጠቅማል)" },
    { key: "phone", question: "📞 ስልክ ቁጥርዎ:" },
    { key: "name", question: "👤 ሙሉ ስምዎ:" },
  ],
  "🔹 ማሽን ለመከራየት": [
    { key: "description", question: "🔹 ምን ዓይነት ማሽን ይፈልጋሉ?\n(ዓይነት፣ ምን ለማድረግ)" },
    { key: "location", question: "📍 ማሽኑ የሚያስፈልግበት ቦታ:" },
    { key: "phone", question: "📞 ስልክ ቁጥርዎ:" },
    { key: "name", question: "👤 ሙሉ ስምዎ:" },
  ],
  "🟥 ብረት ለመግዛት": [
    { key: "description", question: "🟥 ምን ዓይነት ብረት ይፈልጋሉ?\n(ዓይነት፣ መጠን፣ ዲያሜትር)" },
    { key: "quantity", question: "📦 ምን ያህል ኩንታል ይፈልጋሉ?" },
    { key: "location", question: "📍 ቦታ (ለፍለጋ ይጠቅማል):" },
    { key: "phone", question: "📞 ስልክ ቁጥርዎ:" },
    { key: "name", question: "👤 ሙሉ ስምዎ:" },
  ],
  "እንጃ ለማግኘት": [
    { key: "quantity", question: "🫓 ምን ያህል እንጃ ይፈልጋሉ?\n(ብዛት ወይም ዓይነት)" },
    { key: "location", question: "📍 እንጃ የሚፈልጉበት ቦታ:" },
    { key: "phone", question: "📞 ስልክ ቁጥርዎ:" },
    { key: "name", question: "👤 ሙሉ ስምዎ:" },
  ],
};

const sessions = new Map<number, Session>();

export function getSession(chatId: number): Session | undefined {
  return sessions.get(chatId);
}

export function setSession(chatId: number, session: Session): void {
  sessions.set(chatId, session);
}

export function clearSession(chatId: number): void {
  sessions.delete(chatId);
}
