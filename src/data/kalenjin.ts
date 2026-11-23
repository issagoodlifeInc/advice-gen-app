// Kalenjin — first drafts. ONE example only.
//
// This wording was drafted with an AI model for meaning and culture, not
// translated literally, and it is marked as a draft until a Kalenjin
// speaker (Lesley) reviews and corrects it. Spelling and phrasing vary
// across Nandi, Kipsigis, Tugen and other Kalenjin varieties, so it must
// not be treated as final, and it must not enter saved favourite data.
export interface KalenjinDraft {
  sourceEn: string;
  kalenjin: string;
  culturalNote: string;
  status: "ai-drafted-awaiting-human-review";
}

export const KALENJIN_DRAFTS: KalenjinDraft[] = [
  {
    sourceEn: "Don't keep all your eggs in one basket.",
    kalenjin: "Matiny maaiyeguk tugul eng' itoget ake.",
    culturalNote:
      "Read for meaning: don't keep all your grain in one granary / everything you depend on in one place.",
    status: "ai-drafted-awaiting-human-review",
  },
];

// Kiswahili (auto-translation reference) for the same saying.
export const KALENJIN_SWAHILI_REFERENCE =
  "“Usiweke mayai yako yote kwenye kikapu kimoja” — culturally, “Usiweke nafaka zako zote kwenye ghala moja.”";
