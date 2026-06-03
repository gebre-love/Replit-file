export type BotState = {
  enabled: boolean;
  connected: boolean;
  username: string | null;
  id: number | null;
};

const state: BotState = {
  enabled: false,
  connected: false,
  username: null,
  id: null,
};

export function getBotState(): Readonly<BotState> {
  return state;
}

export function setBotState(patch: Partial<BotState>): void {
  Object.assign(state, patch);
}
