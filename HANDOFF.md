# HANDOFF — 2026-09-28/29 session

**Why this file exists:** mid-session tool outage (see §0) made the user want to restart
Claude Code rather than keep retrying. This captures exact state so nothing is lost.
Per this repo's `CLAUDE.md` Session Start section, a fresh session should read this
file first, then `README.md`.

---

## 0. The tool outage (context, not a task)

Through this session, an intermittent **"server-side auto mode classifier temporarily
unavailable"** error blocked any tool call that touches the network — `curl`/`git`
against a remote, `WebFetch`, `WebSearch`, spawning an `Agent` — while purely local
commands (`echo`, `ls`, reading files) kept working throughout. It came and went
several times (worked, failed, worked again). Not confirmed against Anthropic's public
status page (user checked, saw all-green) — best interpretation is this is a narrow
internal Claude Code auto-mode permission-checking component, not the core API. If a
fresh session hits the same error text, this is a known, previously-seen issue — retry
after a short wait; no user action needed.

**Two actions were fully specified but never executed because of this** — both ready
to run immediately in a fresh session, no re-planning needed:

---

## 1. QuranRoots mobile port — ready to launch, never ran

**Action queued:** fork the session (or in a fresh session, just do this directly) with
the following directive. This was attempted twice via the `Agent` tool and blocked both
times by the outage.

> Switch focus to the QuranRoots mobile port track.
>
> 1. Clone the repo with `gh repo clone codectified/QuranRoots C:\dev\QuranRoots` (it's
>    private — use `gh`, not plain `git clone`).
> 2. Read QuranRoots' own `START-HERE.md`, `CLAUDE.md`, `SESSION-HANDOFF.md`,
>    `docs/PHASE-2-PROGRESS.md`, `docs/MOBILE-APP-PHASE-2.md` to confirm current state.
>    Last known state (via GitHub API only, not verified against real files yet):
>    **Phase 2 of 5, 40% complete** — Phase 1 done (navigation, API, basic screens),
>    all 14 React Context providers ported (TypeScript + AsyncStorage). Tech: React
>    Native 0.76.5, TypeScript, React Navigation, Context API, AsyncStorage. Backend:
>    same Express+Neo4j API as the mindroots web app. Last pushed 2025-11-11 (~pushed
>    10-11 months before this session's date, dormant since).
> 3. Apply this session's design direction, which **supersedes** whatever QuranRoots'
>    own docs say the generic "next task" is:
>    - Web app's corpus rendering is a D3.js force-directed graph
>      (`CorpusGraphScreen.js`) — click a word, get a graph view. **For mobile, park
>      the graph entirely.** Word tap should open a lightweight table/detail panel
>      showing that word's morphology instead (root, word_type, wazn — see `Word` node
>      schema in `docs/neo4j/schema.md` in this repo).
>    - Reading-view layout/chrome/context-menu feel should be modeled on quran.com's
>      own web frontend, [`quran/quran.com-frontend-v2`](https://github.com/quran/quran.com-frontend-v2)
>      (public, GPL-3.0, archived-but-stable — safe reference, not a moving target).
>      It's React, so patterns port more directly into React Native than quran.com's
>      *native* iOS/Android apps would.
>    - quran.com's native apps were evaluated and ruled out as a direct porting
>      source this session (see §3 below for full reasoning) — image-based Mushaf
>      rendering, ayah-only tap (not word-level), and Android's `quran_android` is
>      GPL-3.0 with an explicit non-commercial-reuse request from its maintainers
>      (fine here since MindRoots isn't monetized, but not designed as an embeddable
>      library the way iOS's `QuranEngine` is).
>    - Keep word-level tap as MindRoots' differentiator even though quran.com's own
>      apps only do ayah-level — "their UI polish, our interaction granularity."
>    - **Do NOT integrate the Quran Foundation content API** (translations/tafsir/
>      audio) yet — needs real Developer Console credentials, nobody's registered.
>      Blocker for the user (they know the team), not something to work around.
>    - First concrete deliverable: a reading-view RN component for one surah/ayah
>      range, quran.com visual style, every word independently tappable, tap opens a
>      table/panel (not the graph) using QuranRoots' existing `src/services/apiService.js`.
>    - Guardrails: don't push/deploy without sign-off; don't touch `C:\dev\mindroots`;
>      surface genuinely ambiguous design calls rather than guessing.

---

## 2. Turath.io lexicon indexing — API mapped, need to pick + pull a book

**Backlog origin:** user recalled wanting to index `files.turath.io/books-v3-unobfus/
:book_id.json`. **That exact path 404s on every real book_id tried** — it's not the
live API.

**Real API, verified working this session** (public, no auth/API key — confirmed via
reading the official `turath-sdk` source on GitHub):
- `GET https://api.turath.io/search?q=...&ver=3` — full-text search, returns
  `book_id`, `cat_id`, `author_id`, a `meta` JSON blob (book_name, author_name, vol,
  page), and a highlighted snippet. Verified live.
- `GET https://api.turath.io/book?id=X&include=indexes&ver=3` — full bibliographic
  metadata (title, author, publisher, print history, PDF links). Verified live for
  book_id 3901 (معجم المؤلفين).
- `GET https://api.turath.io/page?book_id=X&pg=N&ver=3` — actual page text (lightly
  HTML-marked-up). **This is the real way to pull full book content** — not a
  monolithic per-book file. Verified live for book_id 3901, page 1.
- `GET https://api.turath.io/author?id=X&ver=3` — author bio metadata.
- `files.turath.io/books/{id}.json` (the SDK's documented "full book dump" endpoint)
  also 404'd on every ID tried — possibly only populated for a subset of books, or a
  stale SDK constant. Not chased further; `/page` pagination is the reliable path.

**No rate limit or ToS documented** in the SDK repo — be a good citizen (identify
MindRoots in a `User-Agent`, reasonable pacing) since the catalog is large (one search
query alone showed `"count":869201` matching passages).

**Next step, not yet done:** user said *"this is a lexicon... download the data
locally... to do a document compatibility analysis with our current root and word
node schema."** No specific book_id was given. Plan going in: search for **لسان
العرب (Lisan al-Arab)** — the classical Arabic dictionary organized strictly by
triliteral root — as the most obvious structural match to this repo's `Root`→`Word`
schema (`Root`: r1/r2/r3/arabic/english/plain_root/sem; `Word`: dictionary-level
entries, currently sourced from Lane's Lexicon — see `docs/neo4j/schema.md`). That
search (`/search?q=لسان العرب`) was queued but never executed — outage hit right
before it ran. **Confirm this is the right book before going further** — it wasn't
explicitly confirmed by the user, just the most obvious choice given "lexicon" +
"root and word node schema."

Once a book_id is picked: pull `/book` metadata, then paginate `/page` until it stops
returning content, save raw pages locally (this repo's scratchpad, not committed) for
the compatibility analysis — **do not push anything to Neo4j yet**, user explicitly
said "download the data locally for now."

---

## 3. Already done this session (don't redo)

- **Cert outage fixed & closed.** nginx was serving a stale, expired cert (2+ months
  since last reload). Reloaded nginx (fixed immediately), added
  `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh` so future certbot renewals
  auto-reload nginx. Verified via dry-run. No follow-up needed.
- **Weak-radical wildcard search fix — committed, deployed, verified live.**
  `RadicalPosition.radical` normalization was assumed but never verified; verified
  false — 551 roots carry un-normalized `أ`/`ى` instead of canonical forms, including
  common defective verbs (رمى was silently missed). Fixed by widening
  `WEAK_RADICALS` in `routes/modules/search-modern.js` (commit `10b5120`), doc updated
  (`RADICAL-SEARCH-INTEGRATION.md`), deployed to production, live-verified against the
  real `/api/search-roots` endpoint.
- **Physics-driven projection pivot — documented, paused, not implemented.**
  `docs/features/linguistics/LEXICON-LANDSCAPE-HANDOFF.md` §5 has the full writeup:
  verified Neo4j properties (permutation/biradical/radical-mass/pair-lift on 4,010
  roots), five layout prototypes tried offline (all as private Claude artifacts +
  scratchpad only, nothing committed/deployed), why each failed or worked, and exactly
  where to resume (§5.4: build the single-radical "first orbit" prototype next, don't
  re-attempt whole-lexicon-at-once or reachability-based branching — both already
  failed). Committed `6290a49`.
- **quran.com compliance research — findings captured in this file's §1, not
  elsewhere yet.** Should probably get its own doc under `docs/features/linguistics/`
  or similar if the QuranRoots work becomes real (e.g., 
  `MOBILE-QURAN-COM-INTEGRATION.md`) — not yet written up formally outside this
  handoff and the conversation transcript.

---

## 4. Broader context — HQ's 6-month goal

Per `C:\dev\hq\ceo\GOALS.md`: *"validate primary quran data, absorb quran.com
front-end resources and merge mindroots corpus rendering logic. push some kind of
mobile version"* — within 6 months, DoD = published iOS/Android app.

Corrected understanding vs. HQ's registry guesses (worth fixing in
`C:\dev\hq\registry\projects.yaml` at some point, not done — HQ files are read-only
from this repo per the `/kickoff` skill's own rules):
- `QuranRoots` is **not** a Quran data source — it's the in-progress React Native
  mobile port of MindRoots itself (see §1).
- `MindRoots_IOS` (also React Native, despite the name) is a separate, more dormant
  (~2 years) earlier attempt at the same idea — not currently the active path.
- The actual "primary quran data" to validate against is most likely **the Quranic
  Arabic Corpus** (`corpus.quran.com`, GPL, maintained by the quran.com team,
  77,429-word morphological annotation) — this thread (data validation specifically)
  hasn't been started yet, was deprioritized in favor of §1/§2 this session.
