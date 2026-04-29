import { useState, useEffect, useCallback, useMemo } from "react";

// ── Defaults ──
const DEFAULT_TOPICS_FR = ["intelligence artificielle", "LLM modeles IA", "IA recrutement RH"];
const DEFAULT_TOPICS_EN = ["artificial intelligence", "large language models", "AI productivity"];
const DEFAULT_PRESETS = [
  { id: 'p_default', name: 'AI & Tech', lang: 'both', color: '#b48c50', topicsFr: DEFAULT_TOPICS_FR, topicsEn: DEFAULT_TOPICS_EN },
];

// ── RSS fetch ──
function googleNewsRssUrl(query, lang) {
  const hl = lang === "fr" ? "fr" : "en";
  const gl = lang === "fr" ? "FR" : "US";
  const ceid = lang === "fr" ? "FR:fr" : "US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

async function fetchRss(query, lang) {
  const rssUrl = googleNewsRssUrl(query, lang);
  const proxyUrl = `/api/rss?url=${encodeURIComponent(rssUrl)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    let items = Array.from(xml.querySelectorAll("item"));
    if (items.length === 0) items = Array.from(xml.getElementsByTagName("item"));
    if (items.length === 0) throw new Error("No items in feed");
    return items.map(item => {
      const title = item.querySelector("title")?.textContent || item.getElementsByTagName("title")[0]?.textContent || "";
      const link = item.querySelector("link")?.textContent || item.getElementsByTagName("link")[0]?.textContent || "";
      const pubDate = item.querySelector("pubDate")?.textContent || item.getElementsByTagName("pubDate")[0]?.textContent || "";
      const source = item.querySelector("source")?.textContent || item.getElementsByTagName("source")[0]?.textContent || extractSourceFromTitle(title);
      const description = item.querySelector("description")?.textContent || item.getElementsByTagName("description")[0]?.textContent || "";
      return { title: cleanTitle(title), link, pubDate, source, description: stripHtml(description) };
    });
  } catch (err) { clearTimeout(timeout); throw new Error(`Fetch failed: ${err.message}`); }
}

function cleanTitle(title) { return title.replace(/\s[-\u2013]\s[^-\u2013]+$/, "").trim(); }
function extractSourceFromTitle(title) { const m = title.match(/[-\u2013]\s([^-\u2013]+)$/); return m ? m[1].trim() : ""; }
function stripHtml(html) { return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim(); }
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
}

let _pc = 0;
const genPresetId = () => `p_${Date.now().toString(36)}_${++_pc}`;

// ── Preset Editor Dialog ──
function PresetDialog({ preset, onSave, onClose }) {
  const isEdit = !!preset?.id;
  const [name, setName] = useState(preset?.name || '');
  const [color, setColor] = useState(preset?.color || '#b48c50');
  const [lang, setLang] = useState(preset?.lang || 'both');
  const [tFr, setTFr] = useState(() => {
    const arr = preset?.topicsFr || ['', '', '', '', ''];
    return [...arr, ...Array(5 - arr.length).fill('')].slice(0, 5);
  });
  const [tEn, setTEn] = useState(() => {
    const arr = preset?.topicsEn || ['', '', '', '', ''];
    return [...arr, ...Array(5 - arr.length).fill('')].slice(0, 5);
  });

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: preset?.id || genPresetId(),
      name: name.trim(),
      color,
      lang,
      topicsFr: tFr.map(t => t.trim()).filter(Boolean),
      topicsEn: tEn.map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.dialog} onClick={e => e.stopPropagation()}>
        <div style={S.dialogHeader}>
          <h3 style={S.dialogTitle}>{isEdit ? 'Edit Preset' : 'New Preset'}</h3>
          <button style={S.iconBtn} onClick={onClose}>x</button>
        </div>
        <div style={S.dialogBody}>
          <label style={S.label}>Preset name</label>
          <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Finance, Crypto..." autoFocus />

          <label style={S.label}>Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0, background: 'none' }} />
            <input style={{ ...S.input, width: 90, fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center', marginBottom: 0 }}
              value={color} onChange={e => { const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v); }}
              placeholder="#hex" maxLength={7} />
            <div style={{ width: 40, height: 24, borderRadius: 6, background: color, border: '1px solid var(--border-primary)' }} />
          </div>

          <label style={S.label}>Language</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[{ v: 'fr', l: '🇫🇷 French only' }, { v: 'en', l: '🇬🇧 English only' }, { v: 'both', l: '🇫🇷+🇬🇧 Both' }].map(o => (
              <button key={o.v} onClick={() => setLang(o.v)} style={{ ...S.langBtn, ...(lang === o.v ? S.langBtnActive : {}) }}>{o.l}</button>
            ))}
          </div>

          {(lang === 'fr' || lang === 'both') && <>
            <label style={S.label}>French topics</label>
            {tFr.map((t, i) => (
              <input key={`fr${i}`} style={{ ...S.input, marginBottom: 6 }} value={t} onChange={e => { const a = [...tFr]; a[i] = e.target.value; setTFr(a); }}
                placeholder={`Topic ${i + 1}`} />
            ))}
          </>}

          {(lang === 'en' || lang === 'both') && <>
            <label style={{ ...S.label, marginTop: 8 }}>English topics</label>
            {tEn.map((t, i) => (
              <input key={`en${i}`} style={{ ...S.input, marginBottom: 6 }} value={t} onChange={e => { const a = [...tEn]; a[i] = e.target.value; setTEn(a); }}
                placeholder={`Topic ${i + 1}`} />
            ))}
          </>}

          <div style={S.dialogActions}>
            <button style={S.ghostBtn} onClick={onClose}>Cancel</button>
            <button style={{ ...S.accentBtn, opacity: name.trim() ? 1 : 0.4 }} onClick={handleSave}>{isEdit ? 'Save' : 'Create Preset'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Article Card ──
function ArticleCard({ article, index, onReadLater, alreadySaved, isNew }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      padding: "18px 24px", borderBottom: "1px solid var(--border-secondary)",
      background: hovered ? "var(--bg-hover)" : isNew ? "var(--accent-surface, rgba(180,140,80,0.04))" : "var(--bg-surface)",
      transition: "background 0.15s", animation: "fadeIn 0.3s ease both", animationDelay: `${index * 30}ms`,
      borderLeft: isNew ? "3px solid var(--accent)" : "3px solid transparent",
    }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px", alignItems: "center" }}>
        {isNew && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "var(--accent)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
            NEW
          </span>
        )}
        {article.source && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.8 }}>
            {article.source}
          </span>
        )}
        <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{timeAgo(article.pubDate)}</span>
        <div style={{ flex: 1 }} />
        {onReadLater && (
          <button onClick={() => onReadLater(article)} disabled={alreadySaved}
            style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 6, cursor: alreadySaved ? "default" : "pointer",
              background: alreadySaved ? "var(--accent-subtle)" : "none", border: "1px solid var(--border-primary)",
              color: alreadySaved ? "var(--accent)" : "var(--text-tertiary)", fontFamily: "var(--font-body)", transition: "all 0.12s",
              opacity: alreadySaved ? 0.6 : 1 }}>
            {alreadySaved ? "Saved" : "Read Later"}
          </button>
        )}
      </div>
      <a href={article.link} target="_blank" rel="noopener noreferrer"
        style={{ display: "block", fontSize: 15, fontWeight: 650, color: "var(--text-primary)", textDecoration: "none", lineHeight: 1.4, marginBottom: 8, fontFamily: "var(--font-body)", letterSpacing: "-0.01em" }}>
        {article.title}
      </a>
      {article.description && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-body)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {article.description}
        </p>
      )}
      <a href={article.link} target="_blank" rel="noopener noreferrer"
        style={{ display: "inline-block", marginTop: 10, fontSize: 12, color: "var(--accent)", textDecoration: "none", fontFamily: "var(--font-mono)", fontWeight: 500, opacity: hovered ? 1 : 0.5, transition: "opacity 0.15s" }}>
        Read article →
      </a>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-secondary)" }}>
      <style>{`.sk{background:linear-gradient(90deg,var(--bg-secondary) 25%,var(--border-secondary) 50%,var(--bg-secondary) 75%);background-size:400px 100%;animation:sk 1.4s infinite;border-radius:4px}@keyframes sk{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div className="sk" style={{ width: 90, height: 17 }} /><div className="sk" style={{ width: 55, height: 17 }} /></div>
      <div className="sk" style={{ width: "88%", height: 19, marginBottom: 8 }} />
      <div className="sk" style={{ width: "55%", height: 19, marginBottom: 12 }} />
      <div className="sk" style={{ width: "100%", height: 13, marginBottom: 5 }} />
      <div className="sk" style={{ width: "70%", height: 13 }} />
    </div>
  );
}

// ── Main Feed Component ──
export default function AIFeed({ initialTopics, onTopicsChange, onReadLater, readingListLinks = [] }) {
  const [activeTab, setActiveTab] = useState("fr");
  const [topicsFr, setTopicsFr] = useState(initialTopics?.topicsFr || DEFAULT_TOPICS_FR);
  const [topicsEn, setTopicsEn] = useState(initialTopics?.topicsEn || DEFAULT_TOPICS_EN);
  const [presets, setPresets] = useState(initialTopics?.presets || DEFAULT_PRESETS);
  const [activePreset, setActivePreset] = useState(null);
  const [articlesFr, setArticlesFr] = useState([]);
  const [articlesEn, setArticlesEn] = useState([]);
  const [loadingFr, setLoadingFr] = useState(false);
  const [loadingEn, setLoadingEn] = useState(false);
  const [errorFr, setErrorFr] = useState(null);
  const [errorEn, setErrorEn] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [presetDialog, setPresetDialog] = useState(null); // null | 'new' | { edit: preset }
  const [toast, setToast] = useState(null);

  // Track the top article from previous session — everything above it is "new"
  const [lastSeenFr, setLastSeenFr] = useState(() => {
    try { return localStorage.getItem('feed-lastseen-fr') || null; } catch { return null; }
  });
  const [lastSeenEn, setLastSeenEn] = useState(() => {
    try { return localStorage.getItem('feed-lastseen-en') || null; } catch { return null; }
  });

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };
  const savedLinksSet = useMemo(() => new Set(readingListLinks), [readingListLinks]);

  useEffect(() => {
    if (initialTopics?.topicsFr?.length) setTopicsFr(initialTopics.topicsFr);
    if (initialTopics?.topicsEn?.length) setTopicsEn(initialTopics.topicsEn);
    if (initialTopics?.presets?.length) setPresets(initialTopics.presets);
  }, [initialTopics]);

  const notifyChange = useCallback((fr, en, pr) => {
    onTopicsChange?.(fr ?? topicsFr, en ?? topicsEn, pr ?? presets);
  }, [topicsFr, topicsEn, presets, onTopicsChange]);

  const fetchAll = useCallback(async (lang, topics) => {
    if (!topics.length) return;
    const isEn = lang === "en";
    const setLoading = isEn ? setLoadingEn : setLoadingFr;
    const setArticles = isEn ? setArticlesEn : setArticlesFr;
    const setError = isEn ? setErrorEn : setErrorFr;
    const currentArticles = isEn ? articlesEn : articlesFr;

    // Save current top article as "last seen" before refresh
    if (currentArticles.length > 0) {
      const topLink = currentArticles[0].link;
      if (isEn) { setLastSeenEn(topLink); try { localStorage.setItem('feed-lastseen-en', topLink); } catch {} }
      else { setLastSeenFr(topLink); try { localStorage.setItem('feed-lastseen-fr', topLink); } catch {} }
    }

    setLoading(true); setError(null);
    try {
      const results = await Promise.allSettled(topics.map(t => fetchRss(t, lang)));
      const seen = new Set();
      const all = results.flatMap(r => r.status === "fulfilled" ? r.value : [])
        .filter(item => { if (!item.link || seen.has(item.link)) return false; seen.add(item.link); return true; })
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      if (all.length === 0) throw new Error("No articles found");
      setArticles(all);
      setLastRefresh(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [articlesFr, articlesEn]);

  // Initial load
  useEffect(() => { fetchAll("fr", topicsFr); fetchAll("en", topicsEn); }, []);

  const handleRefresh = () => { fetchAll("fr", topicsFr); fetchAll("en", topicsEn); };

  // Apply preset
  const applyPreset = (p) => {
    setActivePreset(p.id);
    if (p.lang === 'fr' || p.lang === 'both') { setTopicsFr(p.topicsFr); fetchAll("fr", p.topicsFr); }
    if (p.lang === 'en' || p.lang === 'both') { setTopicsEn(p.topicsEn); fetchAll("en", p.topicsEn); }
    if (p.lang === 'fr') { setArticlesEn([]); setActiveTab('fr'); }
    if (p.lang === 'en') { setArticlesFr([]); setActiveTab('en'); }
    notifyChange(p.lang !== 'en' ? p.topicsFr : topicsFr, p.lang !== 'fr' ? p.topicsEn : topicsEn);
  };

  // Save preset
  const handleSavePreset = (p) => {
    let updated;
    if (presets.find(x => x.id === p.id)) {
      updated = presets.map(x => x.id === p.id ? p : x);
    } else {
      updated = [...presets, p];
    }
    setPresets(updated);
    setPresetDialog(null);
    notifyChange(null, null, updated);
    flash(`Preset "${p.name}" saved`);
  };

  const deletePreset = (id) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    notifyChange(null, null, updated);
    if (activePreset === id) setActivePreset(null);
  };

  const articles = activeTab === "fr" ? articlesFr : articlesEn;
  const loading = activeTab === "fr" ? loadingFr : loadingEn;
  const error = activeTab === "fr" ? errorFr : errorEn;
  const isLoading = loadingFr || loadingEn;
  const lastSeen = activeTab === "fr" ? lastSeenFr : lastSeenEn;

  // Compute which articles are new (above the last-seen marker)
  const newArticleLinks = useMemo(() => {
    if (!lastSeen) return new Set();
    const newLinks = new Set();
    for (const a of articles) {
      if (a.link === lastSeen) break; // stop at the last-seen article
      newLinks.add(a.link);
    }
    return newLinks;
  }, [articles, lastSeen]);

  const handleReadLater = (article) => {
    onReadLater?.(article);
    flash('Added to Reading List');
  };

  return (
    <div style={{ fontFamily: "var(--font-body)", height: "100%", background: "var(--bg-primary)", display: "flex", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ width: "100%", maxWidth: 660 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16 }}>⚡</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>My Feed</h1>
              <p style={{ margin: 0, fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                {lastRefresh ? `Updated at ${lastRefresh}` : "Loading..."}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPresetDialog('new')} style={S.headerBtn} title="New preset">+</button>
            <button onClick={handleRefresh} disabled={isLoading} style={{ ...S.headerBtn, opacity: isLoading ? 0.4 : 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ display: "inline-block", animation: isLoading ? "spin 1s linear infinite" : "none" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>
        </div>

        {/* Presets bar */}
        {presets.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            {presets.map(p => {
              const isActive = activePreset === p.id;
              const c = p.color || '#b48c50';
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <button onClick={() => applyPreset(p)}
                    style={{ ...S.presetChip,
                      background: isActive ? c : c + '18',
                      color: isActive ? "#fff" : c,
                      borderColor: isActive ? c : c + '50',
                    }}>
                    {p.name}
                    {p.lang === 'fr' ? ' \uD83C\uDDEB\uD83C\uDDF7' : p.lang === 'en' ? ' \uD83C\uDDEC\uD83C\uDDE7' : ' \uD83C\uDF10'}
                  </button>
                  <button onClick={() => setPresetDialog({ edit: p })}
                    style={{ ...S.presetEdit, borderColor: c + '50', color: c }} title="Edit">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => deletePreset(p.id)}
                    style={{ ...S.presetDel, borderColor: c + '50', color: c }} title="Delete">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main card */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-secondary)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-secondary)", background: "var(--bg-surface)" }}>
            {[{ id: "fr", label: "🇫🇷 Francais", count: articlesFr.length }, { id: "en", label: "🇬🇧 English", count: articlesEn.length }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, padding: "14px 20px", border: "none", background: "none", cursor: "pointer",
                fontSize: 13.5, fontWeight: activeTab === tab.id ? 650 : 500,
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
                borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {tab.label}
                {tab.count > 0 && <span style={{ fontSize: 10, background: activeTab === tab.id ? "var(--accent-subtle)" : "var(--bg-secondary)", color: activeTab === tab.id ? "var(--accent)" : "var(--text-tertiary)", padding: "1px 6px", borderRadius: 10, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Articles */}
          {loading && articles.length === 0 ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
            : error ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 16px" }}>{error}</p>
                <button onClick={() => fetchAll(activeTab, activeTab === "fr" ? topicsFr : topicsEn)} style={S.accentBtn}>Retry</button>
              </div>
            ) : articles.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No articles found.</p>
              </div>
            ) : articles.map((article, i) => {
              const isNew = newArticleLinks.has(article.link);
              const isLastNew = isNew && (i + 1 >= articles.length || !newArticleLinks.has(articles[i + 1]?.link));
              return (
                <React.Fragment key={article.link + i}>
                  <ArticleCard article={article} index={i} isNew={isNew}
                    onReadLater={handleReadLater} alreadySaved={savedLinksSet.has(article.link)} />
                  {isLastNew && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 24px' }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--accent)' }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Last refresh</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--accent)' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })
          }
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-tertiary)", marginTop: 20, fontFamily: "var(--font-mono)" }}>
          Google News RSS
        </p>
      </div>

      {/* Preset dialog */}
      {presetDialog && (
        <PresetDialog
          preset={presetDialog === 'new' ? null : presetDialog.edit}
          onSave={handleSavePreset}
          onClose={() => setPresetDialog(null)}
        />
      )}

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

// ── Styles ──
const S = {
  headerBtn: {
    padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "none",
    color: "var(--text-secondary)", cursor: "pointer", fontSize: 14, fontFamily: "var(--font-mono)",
    display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
  },
  presetChip: {
    padding: "5px 12px", borderRadius: "8px 0 0 8px", border: "1px solid var(--border-primary)", borderRight: "none",
    background: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 500,
    fontFamily: "var(--font-body)", transition: "all 0.12s", whiteSpace: "nowrap",
  },
  presetChipActive: {
    background: "var(--accent-subtle)", color: "var(--accent)", borderColor: "var(--accent)",
  },
  presetEdit: {
    padding: "5px 8px", border: "1px solid var(--border-primary)", borderRight: "none", borderLeft: "none",
    background: "var(--bg-surface)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, transition: "all 0.12s",
  },
  presetDel: {
    padding: "5px 10px", borderRadius: "0 8px 8px 0", border: "1px solid var(--border-primary)",
    background: "var(--bg-surface)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 15, transition: "all 0.12s",
  },
  backdrop: {
    position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex: 2000, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  dialog: {
    zIndex: 2001, width: 480, maxWidth: "100%", maxHeight: "calc(100vh - 64px)", overflow: "hidden",
    background: "var(--bg-surface)", border: "1px solid var(--border-secondary)", borderRadius: 16,
    boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column",
  },
  dialogHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px",
    borderBottom: "1px solid var(--border-secondary)",
  },
  dialogTitle: { fontSize: 16, fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--text-primary)", margin: 0 },
  dialogBody: { padding: 20, overflowY: "auto", display: "flex", flexDirection: "column" },
  dialogActions: { display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 12 },
  iconBtn: { background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 4, fontSize: 16 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 4 },
  input: {
    width: "100%", padding: "8px 12px", fontSize: 13, border: "1px solid var(--border-primary)", borderRadius: 8,
    background: "var(--bg-primary)", color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-body)", marginBottom: 4,
  },
  langBtn: {
    padding: "5px 10px", fontSize: 12, borderRadius: 6, border: "1px solid var(--border-primary)",
    background: "none", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.12s",
  },
  langBtnActive: { background: "var(--accent-subtle)", color: "var(--accent)", borderColor: "var(--accent)" },
  accentBtn: {
    padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8, background: "var(--accent)", color: "#fff",
    border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
  },
  ghostBtn: {
    padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 8, background: "none",
    color: "var(--text-secondary)", border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
  },
  toast: {
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    background: "var(--accent)", color: "#fff", padding: "8px 20px", borderRadius: 20,
    fontSize: 13, fontWeight: 600, zIndex: 3000, boxShadow: "var(--shadow-md)", whiteSpace: "nowrap",
    animation: "toast 2.2s ease forwards",
  },
};
