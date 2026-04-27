import { useState, useEffect, useCallback } from "react";

const DEFAULT_TOPICS_FR = [
  "intelligence artificielle",
  "LLM modèles IA",
  "IA recrutement RH",
];

const DEFAULT_TOPICS_EN = [
  "artificial intelligence",
  "large language models",
  "AI productivity",
];

function googleNewsRssUrl(query, lang) {
  const hl = lang === "fr" ? "fr" : "en";
  const gl = lang === "fr" ? "FR" : "US";
  const ceid = lang === "fr" ? "FR:fr" : "US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

async function fetchRss(query, lang) {
  const rssUrl = googleNewsRssUrl(query, lang);

  // Use your own Vercel API route — no CORS issues, no third-party dependency
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
      const title =
        item.querySelector("title")?.textContent ||
        item.getElementsByTagName("title")[0]?.textContent || "";
      const link =
        item.querySelector("link")?.textContent ||
        item.getElementsByTagName("link")[0]?.textContent || "";
      const pubDate =
        item.querySelector("pubDate")?.textContent ||
        item.getElementsByTagName("pubDate")[0]?.textContent || "";
      const source =
        item.querySelector("source")?.textContent ||
        item.getElementsByTagName("source")[0]?.textContent ||
        extractSourceFromTitle(title);
      const description =
        item.querySelector("description")?.textContent ||
        item.getElementsByTagName("description")[0]?.textContent || "";

      return {
        title: cleanTitle(title),
        link,
        pubDate,
        source,
        description: stripHtml(description),
      };
    });
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`Fetch failed: ${err.message}`);
  }
}


function cleanTitle(title) {
  return title.replace(/\s[-–]\s[^-–]+$/, "").trim();
}

function extractSourceFromTitle(title) {
  const match = title.match(/[-–]\s([^-–]+)$/);
  return match ? match[1].trim() : "";
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "hier";
  return `il y a ${Math.floor(diff / 86400)}j`;
}

function TopicsEditor({ topics, onChange, lang }) {
  const [newTopic, setNewTopic] = useState("");
  const add = () => {
    const t = newTopic.trim();
    if (t && !topics.includes(t)) { onChange([...topics, t]); setNewTopic(""); }
  };
  return (
    <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", background: "#fafbff" }}>
      <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#94a3b8", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {lang === "fr" ? "Thèmes de recherche" : "Search topics"}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
        {topics.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#1d4ed8", fontFamily: "'Sora',sans-serif" }}>
            {t}
            <button onClick={() => onChange(topics.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#93c5fd", fontSize: "14px", padding: 0, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={newTopic} onChange={e => setNewTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
          placeholder={lang === "fr" ? "Ajouter un thème..." : "Add a topic..."}
          style={{ flex: 1, padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: "7px", fontSize: "12.5px", fontFamily: "'Sora',sans-serif", color: "#0f172a", outline: "none" }} />
        <button onClick={add} style={{ padding: "7px 14px", background: "#2563eb", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "12px", fontFamily: "'Sora',sans-serif", fontWeight: "600" }}>+</button>
      </div>
    </div>
  );
}

function ArticleCard({ article, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
      background: hovered ? "#fafbff" : "#fff",
      transition: "background 0.15s",
      animation: "fadeIn 0.3s ease both",
      animationDelay: `${index * 40}ms`,
    }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px", alignItems: "center" }}>
        {article.source && (
          <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono',monospace", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {article.source}
          </span>
        )}
        <span style={{ fontSize: "11px", color: "#6b7280", fontFamily: "'DM Mono',monospace" }}>{timeAgo(article.pubDate)}</span>
      </div>

      <a href={article.link} target="_blank" rel="noopener noreferrer"
        onMouseEnter={e => e.currentTarget.style.color = "#2563eb"}
        onMouseLeave={e => e.currentTarget.style.color = "#0f172a"}
        style={{ display: "block", fontSize: "15px", fontWeight: "650", color: "#0f172a", textDecoration: "none", lineHeight: "1.4", marginBottom: "8px", fontFamily: "'Sora',sans-serif", letterSpacing: "-0.01em" }}>
        {article.title}
      </a>

      {article.description && (
        <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0, fontFamily: "'Sora',sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {article.description}
        </p>
      )}

      <a href={article.link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "12px", fontSize: "12px", color: "#2563eb", textDecoration: "none", fontFamily: "'DM Mono',monospace", fontWeight: "500", opacity: hovered ? 1 : 0.6, transition: "opacity 0.15s" }}>
        Lire l'article →
      </a>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
      <style>{`.sk{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:400px 100%;animation:sk 1.4s infinite;border-radius:4px}@keyframes sk{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}><div className="sk" style={{ width: "90px", height: "17px" }} /><div className="sk" style={{ width: "55px", height: "17px" }} /></div>
      <div className="sk" style={{ width: "88%", height: "19px", marginBottom: "8px" }} />
      <div className="sk" style={{ width: "55%", height: "19px", marginBottom: "12px" }} />
      <div className="sk" style={{ width: "100%", height: "13px", marginBottom: "5px" }} />
      <div className="sk" style={{ width: "70%", height: "13px" }} />
    </div>
  );
}

export default function AIFeed({ initialTopics, onTopicsChange }) {
  const [activeTab, setActiveTab] = useState("fr");
  const [topicsFr, setTopicsFr] = useState(initialTopics?.topicsFr || DEFAULT_TOPICS_FR);
  const [topicsEn, setTopicsEn] = useState(initialTopics?.topicsEn || DEFAULT_TOPICS_EN);
  const [showTopics, setShowTopics] = useState(false);
  const [articlesFr, setArticlesFr] = useState([]);
  const [articlesEn, setArticlesEn] = useState([]);
  const [loadingFr, setLoadingFr] = useState(false);
  const [loadingEn, setLoadingEn] = useState(false);
  const [errorFr, setErrorFr] = useState(null);
  const [errorEn, setErrorEn] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Restore topics from cloud when initialTopics arrives
  useEffect(() => {
    if (initialTopics?.topicsFr?.length) setTopicsFr(initialTopics.topicsFr);
    if (initialTopics?.topicsEn?.length) setTopicsEn(initialTopics.topicsEn);
  }, [initialTopics]);

  // Notify parent when topics change (for cloud save)
  const setTopicsFrWrapped = (t) => { setTopicsFr(t); onTopicsChange?.(t, topicsEn); };
  const setTopicsEnWrapped = (t) => { setTopicsEn(t); onTopicsChange?.(topicsFr, t); };

  const fetchAll = useCallback(async (lang, topics) => {
    const isEn = lang === "en";
    const setLoading = isEn ? setLoadingEn : setLoadingFr;
    const setArticles = isEn ? setArticlesEn : setArticlesFr;
    const setError = isEn ? setErrorEn : setErrorFr;

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(topics.map(t => fetchRss(t, lang)));
      const seen = new Set();
      const all = results
        .flatMap(r => r.status === "fulfilled" ? r.value : [])
        .filter(item => {
          if (!item.link || seen.has(item.link)) return false;
          seen.add(item.link);
          return true;
        })
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

      if (all.length === 0) throw new Error("Aucun article récupéré");
      setArticles(all);
      setLastRefresh(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(`Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll("fr", DEFAULT_TOPICS_FR);
    fetchAll("en", DEFAULT_TOPICS_EN);
  }, []);

  const handleRefresh = () => { fetchAll("fr", topicsFr); fetchAll("en", topicsEn); };
  const articles = activeTab === "fr" ? articlesFr : articlesEn;
  const loading = activeTab === "fr" ? loadingFr : loadingEn;
  const error = activeTab === "fr" ? errorFr : errorEn;
  const isLoading = loadingFr || loadingEn;

  return (
    <div style={{ fontFamily: "'Sora',sans-serif", height: "100%", background: "#f8fafc", display: "flex", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ width: "100%", maxWidth: "640px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "16px" }}>⚡</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.03em" }}>My Feed</h1>
              <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontFamily: "'DM Mono',monospace" }}>
                {lastRefresh ? `Mis à jour à ${lastRefresh}` : "Chargement..."}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowTopics(s => !s)} style={{ background: showTopics ? "#eff6ff" : "none", border: "1px solid " + (showTopics ? "#bfdbfe" : "#e2e8f0"), borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", color: showTopics ? "#2563eb" : "#64748b", fontFamily: "'DM Mono',monospace", transition: "all 0.15s" }}>
              ⚙ Topics
            </button>
            <button onClick={handleRefresh} disabled={isLoading} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px 12px", cursor: isLoading ? "not-allowed" : "pointer", fontSize: "12px", color: "#64748b", fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", gap: "6px", opacity: isLoading ? 0.5 : 1 }}>
              <span style={{ display: "inline-block", animation: isLoading ? "spin 1s linear infinite" : "none" }}>↻</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8edf5", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)" }}>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
            {[{ id: "fr", label: "🇫🇷 Français", count: articlesFr.length }, { id: "en", label: "🇬🇧 English", count: articlesEn.length }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "14px 20px", border: "none", background: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: activeTab === tab.id ? "650" : "500", color: activeTab === tab.id ? "#0f172a" : "#94a3b8", fontFamily: "'Sora',sans-serif", borderBottom: activeTab === tab.id ? "2px solid #2563eb" : "2px solid transparent", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "-1px" }}>
                {tab.label}
                {tab.count > 0 && <span style={{ fontSize: "10px", background: activeTab === tab.id ? "#eff6ff" : "#f8fafc", color: activeTab === tab.id ? "#2563eb" : "#94a3b8", padding: "1px 6px", borderRadius: "10px", fontFamily: "'DM Mono',monospace", fontWeight: "600" }}>{tab.count}</span>}
              </button>
            ))}
          </div>

          {showTopics && <TopicsEditor topics={activeTab === "fr" ? topicsFr : topicsEn} onChange={activeTab === "fr" ? setTopicsFrWrapped : setTopicsEnWrapped} lang={activeTab} />}

          {loading && articles.length === 0 ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
            : error ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
                <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 16px" }}>{error}</p>
                <button onClick={() => fetchAll(activeTab, activeTab === "fr" ? topicsFr : topicsEn)} style={{ padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "'Sora',sans-serif", fontWeight: "600" }}>Réessayer</button>
              </div>
            ) : articles.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>📭</div>
                <p style={{ color: "#64748b", fontSize: "14px" }}>Aucun article trouvé.</p>
              </div>
            ) : articles.map((article, i) => <ArticleCard key={article.link + i} article={article} index={i} />)
          }
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#cbd5e1", marginTop: "20px", fontFamily: "'DM Mono',monospace" }}>
          Google News RSS · 100% gratuit
        </p>
      </div>
    </div>
  );
}
