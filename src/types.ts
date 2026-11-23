// Shared types for the advice generator.
export interface AdviceSlip {
  id: number;
  advice: string;
}

export type Language = "en" | "sw";

// A saved favourite. Kalenjin is deliberately NOT part of a favourite:
// Kalenjin wording only enters saved data after Lesley reviews and
// approves it, and no Kalenjin text has been approved yet.
export interface Favourite {
  adviceId: number;
  adviceEn: string;
  adviceSw: string | null;
  createdAt: string;
}
