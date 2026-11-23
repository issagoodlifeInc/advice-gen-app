import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Footer from "./components/Footer";
import diceIcon from "./images/icon-dice.svg";
import dividerDesktop from "./images/pattern-divider-desktop.svg";
import dividerMobile from "./images/pattern-divider-mobile.svg";
import { SW_SEED_CACHE } from "./data/swahiliCache";
import { FALLBACKS } from "./data/fallbacks";
import { findBibleVerse, type BibleVerse } from "./data/bibleVerses";
import { KALENJIN_DRAFTS, KALENJIN_SWAHILI_REFERENCE } from "./data/kalenjin";
import {
  clearFavourites as apiClearFavourites,
  loadFavourites as apiLoadFavourites,
  removeFavourite as apiRemoveFavourite,
  saveFavourite as apiSaveFavourite,
} from "./api/favourites";
import type { AdviceSlip, Favourite, Language } from "./types";

const API_URL = "https://api.adviceslip.com/advice";

const I18N: Record<
  Language,
  {
    adviceWord: string;
    save: string;
    saved: string;
    copy: string;
    copied: string;
    share: string;
    favourites: string;
    savedCount: (n: number) => string;
    empty: string;
    loading: string;
    loadingShort: string;
    error: string;
    retry: string;
    clear: string;
    remove: string;
    copyFav: string;
    toastSaved: string;
    toastRemoved: string;
    toastCopied: string;
    toastShared: string;
    toastBackendDown: string;
    noteShowingEn: string;
    noteCached: (id: number) => string;
    soon: string;
    footerNote: string;
  }
> = {
  en: {
    adviceWord: "Advice",
    save: "Save",
    saved: "Saved",
    copy: "Copy",
    copied: "Copied!",
    share: "Share",
    favourites: "Favourites",
    savedCount: (n) => `${n}${n === 1 ? " saved" : " saved"}`,
    empty:
      "No favourites yet.<br>When a piece of advice lands, tap <strong>Save</strong> and it will live here — saved in the database, not just this session.",
    loading: "Loading your first piece of advice…",
    loadingShort: "Loading advice…",
    error: "Couldn't load advice. Check your connection and try again.",
    retry: "Try again",
    clear: "Clear all favourites",
    remove: "Remove favourite",
    copyFav: "Copy favourite",
    toastSaved: "Saved to favourites",
    toastRemoved: "Removed from favourites",
    toastCopied: "Advice copied",
    toastShared: "Thanks for sharing",
    toastBackendDown:
      "Favourites need the backend running — start the server (see server/README.md).",
    noteShowingEn:
      "Translating to Kiswahili… if it can't be reached, English (the source) stays shown.",
    noteCached: (id) =>
      `Kiswahili · Auto-translated and cached for Advice #${id} — it won't be re-translated.`,
    soon: "Draft",
    footerNote:
      "English is the source language. Kiswahili is auto-translated via MyMemory and cached by Advice #ID, so the same slip is never re-translated. Kalenjin drafts are AI-drafted and awaiting human review.",
  },
  sw: {
    adviceWord: "Ushauri",
    save: "Hifadhi",
    saved: "Imehifadhiwa",
    copy: "Nakili",
    copied: "Imenakiliwa!",
    share: "Shiriki",
    favourites: "Vipendwa",
    savedCount: (n) => `${n} vimehifadhiwa`,
    empty:
      "Hakuna vipendwa bado.<br>Ushauri ukikugusa, gusa <strong>Hifadhi</strong> na utahifadhiwa kwenye hifadhidata, si kwa kipindi hiki tu.",
    loading: "Inapakia ushauri wako wa kwanza…",
    loadingShort: "Inapakia ushauri…",
    error: "Imeshindwa kupakia ushauri. Angalia mtandao wako na ujaribu tena.",
    retry: "Jaribu tena",
    clear: "Futa vipendwa vyote",
    remove: "Ondoa kipendwa",
    copyFav: "Nakili kipendwa",
    toastSaved: "Imehifadhiwa kwenye vipendwa",
    toastRemoved: "Imeondolewa kwenye vipendwa",
    toastCopied: "Ushauri umenakiliwa",
    toastShared: "Asante kwa kushiriki",
    toastBackendDown:
      "Vipendwa vinahitaji seva — anza seva (angalia server/README.md).",
    noteShowingEn:
      "Inatafsiriwa kwa Kiswahili… isipowezekana, Kiingereza (chanzo) kitaendelea kuonyeshwa.",
    noteCached: (id) =>
      `Kiswahili · Imetafsiriwa kiotomatiki na kuhifadhiwa kwa Ushauri #${id} — haitatafsiriwa tena.`,
    soon: "Rasimu",
    footerNote:
      "Kiingereza ndio lugha chanzo. Kiswahili hutafsiriwa kiotomatiki kupitia MyMemory na kuhifadhiwa kwa Advice #ID. Rasimu za Kalenjin zimeandikwa na AI na zinasubiri uhakiki wa binadamu.",
  },
};

export default function App() {
  const [lang, setLang] = useState<Language>("en");
  const [current, setCurrent] = useState<AdviceSlip | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [backendDown, setBackendDown] = useState(false);
  const [isOfflineExample, setIsOfflineExample] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [width, setWidth] = useState(window.innerWidth);
  const [bible, setBible] = useState<{ verse: BibleVerse; matched: boolean } | null>(null);
  const [spinning, setSpinning] = useState(false);

  // Swahili cache, keyed by Advice #ID — seeded, then filled by
  // auto-translation. The same ID is never re-translated.
  const swCacheRef = useRef<Record<number, string>>({ ...SW_SEED_CACHE });
  const toastTimerRef = useRef<number | undefined>(undefined);

  const t = I18N[lang];

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const swFor = useCallback((slip: AdviceSlip): string | null => {
    return swCacheRef.current[slip.id] ?? null;
  }, []);

  // Automatic Swahili translation via MyMemory, cached by advice ID.
  const tryTranslate = useCallback((slip: AdviceSlip) => {
    if (swCacheRef.current[slip.id]) return; // cache hit — do not re-translate
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      slip.advice,
    )}&langpair=en|sw`;
    axios
      .get(url, { timeout: 4500 })
      .then((res) => {
        const txt: string | undefined = res.data?.responseData?.translatedText;
        // MyMemory's free quota is shared per IP: when it runs out it
        // returns a "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE
        // TRANSLATIONS" message instead of a translation. Never cache
        // that as if it were Swahili — keep the English fallback instead.
        if (
          txt &&
          txt.toLowerCase() !== slip.advice.toLowerCase() &&
          !/MYMEMORY WARNING/i.test(txt)
        ) {
          swCacheRef.current[slip.id] = txt;
        }
      })
      .catch(() => {
        // Keep the English fallback note; nothing else to do.
      });
  }, []);

  const fetchOnce = useCallback(async (): Promise<AdviceSlip> => {
    const res = await axios.get<{ slip: AdviceSlip }>(API_URL, {
      params: { t: Date.now() }, // cache-bust: Advice Slip caches /advice briefly
      timeout: 8000,
    });
    return res.data.slip;
  }, []);

  const getAdvice = useCallback(
    async (attempt = 0) => {
      setIsLoading(true);
      setError(null);
      setSpinning(true);
      window.setTimeout(() => setSpinning(false), 700);
      try {
        const slip = await fetchOnce();
        if (!slip || !slip.advice) throw new Error("Empty slip");
        // No repeat twice in a row: retry up to 3 times.
        if (lastId !== null && slip.id === lastId && attempt < 3) {
          return getAdvice(attempt + 1);
        }
        setCurrent({ id: slip.id, advice: slip.advice });
        setLastId(slip.id);
        setIsOfflineExample(false);
        setIsLoading(false);
        if (lang === "sw") tryTranslate({ id: slip.id, advice: slip.advice });
      } catch {
        setIsLoading(false);
        if (!current) {
          // First load failed (e.g. offline): show a clearly-labelled
          // example slip instead of an error box alongside real advice.
          const pool = FALLBACKS.filter((f) => f.id !== lastId);
          const pick = pool[Math.floor(Math.random() * pool.length)];
          setCurrent({ id: pick.id, advice: pick.advice });
          setLastId(pick.id);
          setIsOfflineExample(true);
          setError(null);
          return;
        }
        // A refresh failed but we still have advice: keep it and say
        // plainly that the new fetch failed.
        setError(
          lang === "sw"
            ? "Imeshindwa kupakia ushauri mpya — inaonyesha wa mwisho uliopatikana."
            : "Couldn't load new advice — showing your last one.",
        );
      }
    },
    [current, fetchOnce, lang, lastId, tryTranslate],
  );

  // Load favourites from the backend on first render.
  useEffect(() => {
    apiLoadFavourites()
      .then((favs) => {
        setFavourites(favs);
        setBackendDown(false);
      })
      .catch(() => {
        // Backend not running: favourites are unavailable, and the app
        // says so instead of silently using localStorage.
        setBackendDown(true);
      });
  }, []);

  // First advice + responsive divider.
  useEffect(() => {
    const updateDimensions = () => setWidth(window.innerWidth);
    window.addEventListener("resize", updateDimensions);
    getAdvice(0);
    return () => window.removeEventListener("resize", updateDimensions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayText = useCallback(
    (slip: AdviceSlip): { text: string; fallback: boolean } => {
      if (lang === "sw") {
        const sw = swFor(slip);
        if (sw) return { text: sw, fallback: false };
        return { text: slip.advice, fallback: true };
      }
      return { text: slip.advice, fallback: false };
    },
    [lang, swFor],
  );

  const copyText = useCallback(
    (text: string) => {
      const done = () => showToast(t.toastCopied);
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => done());
      } else {
        done();
      }
    },
    [showToast, t.toastCopied],
  );

  const isFav = current
    ? favourites.some((f) => f.adviceId === current.id)
    : false;

  const handleFav = async () => {
    if (!current) return;
    if (isFav) {
      try {
        await apiRemoveFavourite(current.id);
        setFavourites((prev) => prev.filter((f) => f.adviceId !== current.id));
        showToast(t.toastRemoved);
      } catch {
        showToast(t.toastBackendDown);
      }
      return;
    }
    try {
      const saved = await apiSaveFavourite(
        current.id,
        current.advice,
        swFor(current),
      );
      setFavourites((prev) => [saved, ...prev]);
      showToast(t.toastSaved);
    } catch {
      showToast(t.toastBackendDown);
    }
  };

  const handleBible = () => {
    if (!current) return;
    setBible(findBibleVerse(current.advice));
  };

  const handleShare = () => {
    if (!current) return;
    const text = displayText(current).text;
    const shareData = {
      title: `Advice #${current.id}`,
      text: `“${text}” — Advice #${current.id}`,
    };
    if (navigator.share) {
      navigator.share(shareData).then(() => showToast(t.toastShared)).catch(() => {});
    } else {
      copyText(text);
    }
  };

  const switchLang = (next: Language) => {
    if (next === lang) return;
    setLang(next);
    if (next === "sw" && current) tryTranslate(current);
  };

  const kalenjinDraft = KALENJIN_DRAFTS[0];
  const displayed = current ? displayText(current) : null;

  return (
    <div className="wrap">
      {/* Top — language only, no headline: the advice card is the first thing you see */}
      <div className="topbar">
        <div className="lang-wrap">
          <div className="segmented" role="group" aria-label="Language">
            <button
              type="button"
              aria-pressed={lang === "en"}
              onClick={() => switchLang("en")}
            >
              English
            </button>
            <button
              type="button"
              aria-pressed={lang === "sw"}
              onClick={() => switchLang("sw")}
            >
              Kiswahili
            </button>
            <button
              type="button"
              aria-pressed={false}
              title="Kalenjin — AI-drafted examples, awaiting human review"
              onClick={() => {
                document
                  .getElementById("kalenjinSection")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                showToast(
                  lang === "sw"
                    ? "Kalenjin: rasimu ya AI — inasubiri uhakiki"
                    : "Kalenjin: AI-drafted — awaiting human review",
                );
              }}
            >
              Kalenjin <span className="soon">{t.soon}</span>
            </button>
          </div>
        </div>
      </div>

      <main>
        <section
          className={`card${isLoading ? " is-loading" : ""}`}
          aria-live="polite"
        >
          <p className="advice-label">
            <span>{t.adviceWord}</span> #{current ? current.id : "—"}
          </p>
          <blockquote>
            <p className="quote">
              {displayed ? displayed.text : t.loading}
            </p>
          </blockquote>
          <div className="skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p
            className="translation-note"
            hidden={!(lang === "sw" && current)}
          >
            {current &&
              (displayed?.fallback
                ? t.noteShowingEn
                : t.noteCached(current.id))}
          </p>
          <p className={`offline-note${isOfflineExample ? " show" : ""}`}>
            Offline — showing an example slip. Tap the dice to try the live
            API again.
          </p>
          <div className={`error-box${error ? " show" : ""}`} role="alert">
            <span>{error ?? t.error}</span>
            <br />
            <button type="button" onClick={() => getAdvice(0)}>
              {t.retry}
            </button>
          </div>
          <div className="divider" aria-hidden="true">
            <img
              src={width >= 580 ? dividerDesktop : dividerMobile}
              alt=""
            />
          </div>
          <button
            className={`dice-btn${spinning ? " spinning" : ""}`}
            type="button"
            aria-label="Get new advice"
            disabled={isLoading}
            onClick={() => getAdvice(0)}
          >
            <img src={diceIcon} alt="" />
          </button>
        </section>

        <div className="actions">
          <button
            className="btn"
            type="button"
            aria-pressed={isFav}
            onClick={handleFav}
          >
            {isFav ? t.saved : t.save}
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => current && copyText(displayText(current).text)}
          >
            {t.copy}
          </button>
          <button className="btn" type="button" onClick={handleShare}>
            {t.share}
          </button>
          <button className="btn" type="button" onClick={handleBible}>
            Bible Advice
          </button>
        </div>
        <p className="toast" role="status">
          {toast}
        </p>

        <section className="bible-section" aria-labelledby="bibleHeading">
          <div className="fav-head">
            <h2 id="bibleHeading">Bible Advice · NIV</h2>
            <span className="fav-count">
              {bible ? `${bible.verse.ref} (NIV)` : "Tap Bible Advice"}
            </span>
          </div>
          {!bible && (
            <p className="bible-empty">
              Tap <strong>Bible Advice</strong> above and I&apos;ll find a
              verse that fits the advice on screen.
            </p>
          )}
          {bible && (
            <article className="bible-card">
              <p className="bible-label">Bible Advice · NIV</p>
              <p className="bible-text">“{bible.verse.text}”</p>
              <p className="bible-ref">{bible.verse.ref} (NIV)</p>
              <p className="bible-match">
                {bible.matched
                  ? `Matched to Advice #${current?.id} — a Bible verse on the same idea.`
                  : "No close match for this advice, so here's a Bible thought for today instead."}
              </p>
              <div style={{ marginTop: 14 }}>
                <button
                  className="btn"
                  type="button"
                  onClick={() =>
                    copyText(`“${bible.verse.text}” — ${bible.verse.ref} (NIV)`)
                  }
                >
                  Copy verse
                </button>
              </div>
            </article>
          )}
        </section>

        <section className="fav-section" aria-labelledby="favHeading">
          <div className="fav-head">
            <h2 id="favHeading">{t.favourites}</h2>
            <span className="fav-count">{t.savedCount(favourites.length)}</span>
          </div>
          {backendDown && (
            <p className="fav-empty">
              Favourites live in the database, and the backend isn&apos;t
              running right now. Start it with <code>npm install</code> then{" "}
              <code>node index.js</code> in the <code>server/</code> folder —
              see server/README.md.
            </p>
          )}
          {!backendDown && favourites.length === 0 && (
            <p
              className="fav-empty"
              dangerouslySetInnerHTML={{ __html: t.empty }}
            />
          )}
          <ul className="fav-list">
            {favourites.map((f) => {
              const text = lang === "sw" && f.adviceSw ? f.adviceSw : f.adviceEn;
              return (
                <li className="fav-item" key={f.adviceId}>
                  <div className="fav-item-main">
                    <p className="fav-item-id">
                      {t.adviceWord} #{f.adviceId}
                    </p>
                    <p className="fav-item-text">“{text}”</p>
                  </div>
                  <div className="fav-item-actions">
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={t.copyFav}
                      title={t.copy}
                      onClick={() => copyText(text)}
                    >
                      ⧉
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={t.remove}
                      title={t.remove}
                      onClick={async () => {
                        try {
                          await apiRemoveFavourite(f.adviceId);
                          setFavourites((prev) =>
                            prev.filter((x) => x.adviceId !== f.adviceId),
                          );
                          showToast(t.toastRemoved);
                        } catch {
                          showToast(t.toastBackendDown);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {favourites.length > 0 && (
            <div className="clear-row">
              <button
                className="text-btn"
                type="button"
                onClick={async () => {
                  try {
                    await apiClearFavourites();
                    setFavourites([]);
                  } catch {
                    showToast(t.toastBackendDown);
                  }
                }}
              >
                {t.clear}
              </button>
            </div>
          )}
        </section>

        <section
          className="kal-section"
          id="kalenjinSection"
          aria-labelledby="kalHeading"
        >
          <div className="fav-head">
            <h2 id="kalHeading">Kalenjin — first drafts</h2>
            <span className="fav-count">Example 1 of 1</span>
          </div>
          <article className="kal-card">
            <span className="kal-badge">
              ✎ AI-drafted — awaiting human review
            </span>
            <p className="kal-source">Source · English (original proverb)</p>
            <p className="kal-en">“{kalenjinDraft.sourceEn}”</p>
            <p className="kal-source">
              Kalenjin · Draft for meaning, not word-for-word
            </p>
            <p className="kal-draft" lang="kln">
              “{kalenjinDraft.kalenjin}”
            </p>
            <p className="kal-meaning">
              <strong>How to read this draft:</strong> <em>Maaiyat</em> is
              Kalenjin for egg (plural <em>maaiyik / maaiyat</em>), but the
              point isn&apos;t really eggs or a basket. In a Kalenjin farming
              home the same warning lands more naturally as:{" "}
              <strong>
                don&apos;t keep all your grain in one granary, and don&apos;t
                keep everything you depend on in one place
              </strong>{" "}
              — if that one store fails, everything is lost. Spread what
              matters across more than one place, so one loss doesn&apos;t
              take it all.
            </p>
            <p className="kal-meaning">
              <strong>Why it&apos;s marked as a draft:</strong> Kalenjin is a
              low-resource language that standard translators barely cover,
              and spelling and phrasing vary across Nandi, Kipsigis, Tugen
              and other Kalenjin varieties. This version was drafted with an
              AI model for meaning and culture, not translated literally — a
              Kalenjin speaker should review and correct it before it&apos;s
              treated as final.
            </p>
            <p className="kal-sw">
              <strong>Kiswahili (auto-translation reference):</strong>{" "}
              {KALENJIN_SWAHILI_REFERENCE}
            </p>
            <div
              style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}
            >
              <button
                className="btn"
                type="button"
                onClick={() => copyText(kalenjinDraft.kalenjin)}
              >
                Copy Kalenjin draft
              </button>
              <button
                className="btn"
                type="button"
                onClick={() =>
                  copyText(
                    `${kalenjinDraft.sourceEn} — Kalenjin (AI-drafted, awaiting human review): ${kalenjinDraft.kalenjin} ${kalenjinDraft.culturalNote}`,
                  )
                }
              >
                Copy with English source
              </button>
            </div>
          </article>
        </section>
      </main>

      <footer>
        Advice from{" "}
        <a href="https://api.adviceslip.com" target="_blank" rel="noopener noreferrer">
          api.adviceslip.com
        </a>{" "}
        · Fetched with Axios, as in your original build
        <br />
        <span>{t.footerNote}</span>
      </footer>
      <Footer />
    </div>
  );
}
