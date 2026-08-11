import { useState, useRef, useCallback, useMemo, useEffect } from "react";

/* ───────── EMOJI LIBRARY ───────── */
const EMOJI_CATEGORIES = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😉","😊","😇","🥰","😍","🤩","😘","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  "Gestures": ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","👀","👁️","🧠","🫀","🫁","🦷","🦴","👅","👄"],
  "Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🪸","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔"],
  "Nature": ["🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪴","🎋","🍃","🍂","🍁","🪺","🪹","🍄","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌙","🌎","🌍","🌏","🪐","💫","⭐","🌟","✨","⚡","☄️","💥","🔥","🌪️","🌈","☀️","☁️","❄️","☃️","⛄","💨","💧","💦","🫧","☔","🌊"],
  "Food": ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🌽","🥕","🥔","🍠","🥐","🍞","🥖","🥨","🧇","🥞","🍳","🥚","🧀","🥩","🍖","🍗","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🥙","🧆","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍙","🍚","🍘","🍥","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🥜","🍯","🥛","☕","🍵","🧃","🥤","🧋","🍺","🍻","🥂","🍷","🍸","🍹","🍾"],
  "Activities": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🏑","🥍","🏏","🥅","⛳","🏹","🎣","🥊","🥋","🛹","🛼","🛷","⛸️","🥌","🎿","🏆","🏅","🥇","🥈","🥉","🎃","🎄","🎆","🎇","🧨","✨","🎈","🎉","🎊","🎀","🎁","🎮","🕹️","🎲","🧩","🧸","🪩","🎴","🎭","🖼️","🎨","🧵","🧶"],
  "Travel": ["🚗","🚕","🚙","🚌","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🚲","🛴","✈️","🛩️","🛫","🛬","🚁","🚀","🛸","🏠","🏡","🏗️","🏢","🏬","🏥","🏦","🏨","🏪","🏫","🏛️","⛪","🕌","⛩️","🏞️","🌅","🌄","🌠","🌇","🌆","🏙️","🌃","🌌","🌉"],
  "Objects": ["⌚","📱","💻","⌨️","🖥️","🖨️","💽","💾","💿","📷","📸","📹","🎥","📺","📻","🎙️","🎚️","🎛️","⏰","🕰️","⌛","📡","🔋","🔌","💡","🔦","🕯️","💸","💵","💰","💳","💎","⚖️","🧰","🔧","🔨","🛠️","⚙️","🔮","📿","🧿","💊","💉","🧬","🌡️","🔑","🗝️","🚪","🪑","🛋️","🛏️","🧸","🖼️","🛍️","🛒","🎁","🎈","✉️","📩","📨","📧","💌","📦","📯","📜","📃","📄","📊","📈","📉","📋","📁","📂","📰","📓","📕","📗","📘","📙","📚","📖","🔖","📎","📐","📏","📌","📍","✂️","🖊️","🖋️","✒️","🖌️","🖍️","📝","✏️","🔍","🔎","🔒","🔓"],
  "Symbols": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","❤️‍🔥","💟","☮️","✝️","☪️","🕉️","☸️","✡️","☯️","⚛️","❌","⭕","🛑","⛔","🚫","💯","♨️","❗","❕","❓","❔","‼️","⁉️","⚠️","♻️","✅","❇️","✳️","❎","🌐","💠","▶️","⏸️","⏹️","⏺️","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","🔀","🔁","🔄","🎵","🎶","➕","➖","➗","✖️","♾️","💲","™️","©️","®️","✔️","☑️","🔘","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔸","🔹","🔶","🔷","🔔","🔕","📣","📢","💬","💭"],
  "Flags": ["🏳️","🏴","🏁","🚩","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️","🇦🇷","🇦🇺","🇦🇹","🇧🇪","🇧🇷","🇨🇦","🇨🇱","🇨🇳","🇨🇴","🇭🇷","🇨🇿","🇩🇰","🇪🇬","🇫🇮","🇫🇷","🇩🇪","🇬🇷","🇭🇰","🇭🇺","🇮🇳","🇮🇩","🇮🇪","🇮🇱","🇮🇹","🇯🇵","🇰🇷","🇲🇽","🇳🇱","🇳🇿","🇳🇴","🇵🇰","🇵🇪","🇵🇭","🇵🇱","🇵🇹","🇷🇴","🇷🇺","🇸🇦","🇸🇬","🇿🇦","🇪🇸","🇸🇪","🇨🇭","🇹🇼","🇹🇭","🇹🇷","🇺🇦","🇦🇪","🇬🇧","🇺🇸","🇻🇳"],
};

const BUILT_IN_PRESETS = [
  { name: "Urgent", color: "#E53935", sticker: "🔥", stickerX: 0.78, stickerY: 0.75, stickerScale: 1 },
  { name: "Done", color: "#43A047", sticker: "✅", stickerX: 0.78, stickerY: 0.75, stickerScale: 1 },
  { name: "In Progress", color: "#FB8C00", sticker: "⚡", stickerX: 0.78, stickerY: 0.75, stickerScale: 1 },
  { name: "Archive", color: "#78909C", sticker: "📦", stickerX: 0.78, stickerY: 0.75, stickerScale: 1 },
  { name: "Personal", color: "#8E24AA", sticker: "❤️", stickerX: 0.78, stickerY: 0.75, stickerScale: 1 },
  { name: "Work", color: "#1E88E5", sticker: "💼", stickerX: 0.78, stickerY: 0.75, stickerScale: 1 },
];

const PALETTE = [
  "#F7C948","#F59E42","#E53935","#D81B60","#8E24AA",
  "#5E35B1","#3949AB","#1E88E5","#039BE5","#00ACC1",
  "#00897B","#43A047","#7CB342","#C0CA33","#78909C",
  "#8D6E63","#37474F","#ECEFF1","#FFF9C4","#FFE0B2",
];

const darken = (hex, amt) => {
  let c = hex.replace("#","");
  let [r,g,b] = [0,2,4].map(i => Math.max(0, parseInt(c.substr(i,2),16) - amt));
  return `rgb(${r},${g},${b})`;
};
const lighten = (hex, amt) => {
  let c = hex.replace("#","");
  let [r,g,b] = [0,2,4].map(i => Math.min(255, parseInt(c.substr(i,2),16) + amt));
  return `rgb(${r},${g},${b})`;
};

/* ── Canvas renderer for export ── */
function renderFolderToCanvas(canvas, color, sticker, coverImg, sz, stickerX, stickerY, stickerScale) {
  const ctx = canvas.getContext("2d");
  canvas.width = sz; canvas.height = sz;
  ctx.clearRect(0, 0, sz, sz);
  const tabH=sz*0.16, tabW=sz*0.38, bodyTop=tabH*0.72, r=sz*0.032, bodyH=sz*0.68, x0=sz*0.1, bodyW=sz*0.8;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.22)"; ctx.shadowBlur = sz*0.04; ctx.shadowOffsetY = sz*0.015;
  const tg = ctx.createLinearGradient(0,sz*0.1,0,sz*0.1+tabH);
  tg.addColorStop(0,lighten(color,10)); tg.addColorStop(1,darken(color,10));
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(x0+r,sz*0.1); ctx.lineTo(x0+tabW-r,sz*0.1);
  ctx.quadraticCurveTo(x0+tabW,sz*0.1,x0+tabW,sz*0.1+r);
  ctx.lineTo(x0+tabW+tabH*0.4,sz*0.1+r+tabH*0.55);
  ctx.quadraticCurveTo(x0+tabW+tabH*0.4+r*0.5,bodyTop,x0+tabW+tabH*0.4+r*1.5,bodyTop);
  ctx.lineTo(x0+bodyW,bodyTop); ctx.lineTo(x0,bodyTop); ctx.lineTo(x0,sz*0.1+r);
  ctx.quadraticCurveTo(x0,sz*0.1,x0+r,sz*0.1); ctx.closePath(); ctx.fill();
  const bg = ctx.createLinearGradient(0,bodyTop,0,bodyTop+bodyH);
  bg.addColorStop(0,lighten(color,20)); bg.addColorStop(1,darken(color,30));
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x0,bodyTop,bodyW,bodyH,r); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.strokeStyle=lighten(color,40); ctx.globalAlpha=0.35; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(x0+2,bodyTop+2,bodyW-4,bodyH-4,r); ctx.stroke(); ctx.restore();
  if (coverImg) {
    ctx.save();
    const cx=x0+6,cy=bodyTop+10,cw=bodyW-12,ch=bodyH-20;
    ctx.beginPath(); ctx.roundRect(cx,cy,cw,ch,r); ctx.clip();
    const ir=coverImg.width/coverImg.height,br=cw/ch;
    let sx,sy,sw,sh;
    if(ir>br){sh=coverImg.height;sw=sh*br;sx=(coverImg.width-sw)/2;sy=0;}
    else{sw=coverImg.width;sh=sw/br;sx=0;sy=(coverImg.height-sh)/2;}
    ctx.drawImage(coverImg,sx,sy,sw,sh,cx,cy,cw,ch);
    ctx.restore();
  }
  if (sticker) {
    const scx = stickerX * sz, scy = stickerY * sz;
    const sr = sz * 0.09 * stickerScale;
    ctx.save(); ctx.globalAlpha=0.85; ctx.fillStyle="white";
    ctx.beginPath(); ctx.arc(scx,scy,sr,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.font=`${sz*0.11*stickerScale}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(sticker,scx,scy); ctx.restore();
  }
}

/* ── Interactive folder preview (SVG) ── */
function FolderPreview({ color, sticker, coverImage, size, stickerX, stickerY, stickerScale, onStickerMove, onStickerScale }) {
  const svgRef = useRef(null);
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const tabH=size*0.16, bodyTop=tabH*0.72, r=size*0.032, bodyH=size*0.68;
  const scx = stickerX * size, scy = stickerY * size;
  const sr = size * 0.09 * stickerScale;
  const fontSize = size * 0.11 * stickerScale;

  const getSVGPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: ((clientX - rect.left) / rect.width) * size, y: ((clientY - rect.top) / rect.height) * size };
  }, [size]);

  const handlePointerDown = useCallback((e, type) => {
    e.preventDefault(); e.stopPropagation();
    const pt = getSVGPoint(e);
    if (type === "resize") {
      resizing.current = true;
      dragStart.current = { x: pt.x, y: pt.y, sx: stickerScale, sy: 0 };
    } else {
      dragging.current = true;
      dragStart.current = { x: pt.x - scx, y: pt.y - scy, sx: 0, sy: 0 };
    }
    const handleMove = (ev) => {
      ev.preventDefault();
      const p = getSVGPoint(ev);
      if (dragging.current) {
        onStickerMove(
          Math.max(0.05, Math.min(0.95, (p.x - dragStart.current.x) / size)),
          Math.max(0.05, Math.min(0.95, (p.y - dragStart.current.y) / size))
        );
      }
      if (resizing.current) {
        const dist = Math.hypot(p.x - scx, p.y - scy);
        const initDist = Math.hypot(dragStart.current.x - scx, dragStart.current.y - scy);
        onStickerScale(Math.max(0.4, Math.min(2.5, dragStart.current.sx * (dist / Math.max(1, initDist)))));
      }
    };
    const handleUp = () => {
      dragging.current = false; resizing.current = false;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
  }, [getSVGPoint, scx, scy, stickerScale, size, onStickerMove, onStickerScale]);

  const handleWheel = useCallback((e) => {
    if (!sticker) return; e.preventDefault();
    onStickerScale(Math.max(0.4, Math.min(2.5, stickerScale + (e.deltaY > 0 ? -0.08 : 0.08))));
  }, [sticker, stickerScale, onStickerScale]);

  return (
    <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg" onWheel={handleWheel}>
      <defs>
        <linearGradient id="fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lighten(color,20)}/><stop offset="100%" stopColor={darken(color,30)}/></linearGradient>
        <linearGradient id="ft" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lighten(color,10)}/><stop offset="100%" stopColor={darken(color,10)}/></linearGradient>
        <filter id="fs" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="0" dy={size*0.014} stdDeviation={size*0.022} floodOpacity="0.18"/></filter>
        {coverImage && <clipPath id="fc"><rect x={size*0.1+6} y={bodyTop+10} width={size*0.8-12} height={bodyH-20} rx={r}/></clipPath>}
      </defs>
      <g filter="url(#fs)">
        <path d={`M${size*0.1+r},${size*0.1} h${size*0.38-r*2} q${r},0 ${r},${r} l${tabH*0.4},${tabH*0.55} q${r*0.5},${r*0.7} ${r*1.5},${r*0.7} h${size*0.8-size*0.38-tabH*0.4-r*3} q${r},0 ${r},${r} v${bodyTop-size*0.1-tabH+r} h${-(size*0.8)} v${-(bodyTop-size*0.1+r)} q0,${-r} ${r},${-r}z`} fill="url(#ft)"/>
        <rect x={size*0.1} y={bodyTop} width={size*0.8} height={bodyH} rx={r} fill="url(#fb)"/>
        <rect x={size*0.1+2} y={bodyTop+2} width={size*0.8-4} height={bodyH-4} rx={r} fill="none" stroke={lighten(color,40)} strokeWidth="1.5" opacity="0.35"/>
        {coverImage && <image href={coverImage} x={size*0.1+6} y={bodyTop+10} width={size*0.8-12} height={bodyH-20} clipPath="url(#fc)" preserveAspectRatio="xMidYMid slice"/>}
      </g>
      {sticker && (
        <g>
          <circle cx={scx} cy={scy} r={sr} fill="white" opacity="0.85" style={{ cursor: "grab" }}
            onMouseDown={e => handlePointerDown(e, "drag")} onTouchStart={e => handlePointerDown(e, "drag")}/>
          <text x={scx} y={scy} textAnchor="middle" dominantBaseline="central" fontSize={fontSize}
            style={{ cursor: "grab", pointerEvents: "none", userSelect: "none" }}>{sticker}</text>
          <circle cx={scx + sr * 0.75} cy={scy + sr * 0.75} r={Math.max(5, sr * 0.28)}
            fill="rgba(247,201,72,0.9)" stroke="white" strokeWidth="1.5" style={{ cursor: "nwse-resize" }}
            onMouseDown={e => handlePointerDown(e, "resize")} onTouchStart={e => handlePointerDown(e, "resize")}/>
          <g transform={`translate(${scx + sr * 0.75}, ${scy + sr * 0.75})`} style={{ pointerEvents: "none" }}>
            <line x1={-2.5} y1={2.5} x2={2.5} y2={-2.5} stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1={0} y1={2.5} x2={2.5} y2={0} stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </g>
        </g>
      )}
    </svg>
  );
}

/* ── Main Folderico component ── */
export default function Folderico() {
  const [color, setColor] = useState("#F7C948");
  const [sticker, setSticker] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageObj, setCoverImageObj] = useState(null);
  const [activeTab, setActiveTab] = useState("color");
  const [exportSize, setExportSize] = useState(256);
  const [isExporting, setIsExporting] = useState(false);
  const [emojiCat, setEmojiCat] = useState("Smileys");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [stickerX, setStickerX] = useState(0.78);
  const [stickerY, setStickerY] = useState(0.75);
  const [stickerScale, setStickerScale] = useState(1);
  const [customPresets, setCustomPresets] = useState([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const fileInputRef = useRef(null);

  // Load custom presets from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("folderico-presets");
      if (raw) setCustomPresets(JSON.parse(raw));
    } catch {}
  }, []);

  const savePresets = useCallback((presets) => {
    try { localStorage.setItem("folderico-presets", JSON.stringify(presets)); } catch {}
  }, []);

  const handleSaveTemplate = useCallback(() => {
    if (!saveName.trim()) return;
    const template = { id: Date.now().toString(36), name: saveName.trim(), color, sticker, stickerX, stickerY, stickerScale };
    const updated = [...customPresets, template];
    setCustomPresets(updated); savePresets(updated);
    setSaveName(""); setShowSaveForm(false);
  }, [saveName, color, sticker, stickerX, stickerY, stickerScale, customPresets, savePresets]);

  const handleDeleteTemplate = useCallback((id) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated); savePresets(updated);
  }, [customPresets, savePresets]);

  const handleApplyTemplate = useCallback((t) => {
    setColor(t.color); setSticker(t.sticker || null);
    setStickerX(t.stickerX ?? 0.78); setStickerY(t.stickerY ?? 0.75); setStickerScale(t.stickerScale ?? 1);
  }, []);

  const filteredEmojis = useMemo(() => {
    if (!emojiSearch.trim()) return EMOJI_CATEGORIES[emojiCat] || [];
    const q = emojiSearch.toLowerCase();
    return Object.values(EMOJI_CATEGORIES).flat().filter(e => e.includes(q));
  }, [emojiCat, emojiSearch]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setCoverImage(dataUrl);
      const img = new Image();
      img.onload = () => setCoverImageObj(img);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const doExport = useCallback((format) => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        if (format === "png") {
          const canvas = document.createElement("canvas");
          renderFolderToCanvas(canvas, color, sticker, coverImageObj, exportSize, stickerX, stickerY, stickerScale);
          const link = document.createElement("a");
          link.download = `folder-icon-${exportSize}.png`; link.href = canvas.toDataURL("image/png");
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
        } else {
          const sizes = [16, 32, 48, 256];
          const pngDatas = sizes.map(sz => {
            const c = document.createElement("canvas");
            renderFolderToCanvas(c, color, sticker, coverImageObj, sz, stickerX, stickerY, stickerScale);
            const bin = atob(c.toDataURL("image/png").split(",")[1]);
            const arr = new Uint8Array(bin.length);
            for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
            return { size: sz, data: arr };
          });
          const n=pngDatas.length,h=6,d=16;
          let off=h+d*n;
          const tot=off+pngDatas.reduce((s,p)=>s+p.data.length,0);
          const ico=new Uint8Array(tot);
          const v=new DataView(ico.buffer);
          v.setUint16(0,0,true); v.setUint16(2,1,true); v.setUint16(4,n,true);
          pngDatas.forEach((p,i)=>{
            const pos=h+i*d;
            ico[pos]=p.size>=256?0:p.size; ico[pos+1]=p.size>=256?0:p.size;
            ico[pos+2]=0; ico[pos+3]=0;
            v.setUint16(pos+4,1,true); v.setUint16(pos+6,32,true);
            v.setUint32(pos+8,p.data.length,true); v.setUint32(pos+12,off,true);
            off+=p.data.length;
          });
          off=h+d*n;
          pngDatas.forEach(p=>{ico.set(p.data,off);off+=p.data.length;});
          const blob=new Blob([ico],{type:"image/x-icon"});
          const url=URL.createObjectURL(blob);
          const link=document.createElement("a");
          link.download="folder-icon.ico"; link.href=url;
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
          setTimeout(()=>URL.revokeObjectURL(url),2000);
        }
      } catch(err) { console.error("Export error:", err); }
      setIsExporting(false);
    }, 50);
  }, [color, sticker, coverImageObj, exportSize, stickerX, stickerY, stickerScale]);

  const reset = () => {
    setColor("#F7C948"); setSticker(null); setCoverImage(null); setCoverImageObj(null);
    setStickerX(0.78); setStickerY(0.75); setStickerScale(1);
  };

  const tabs = [
    { id:"color", label:"Color" }, { id:"sticker", label:"Sticker" },
    { id:"cover", label:"Cover" }, { id:"presets", label:"Presets" },
  ];
  const catKeys = Object.keys(EMOJI_CATEGORIES);

  return (
    <div className="fold-root">
      <div className="fold-shell">
        <div className="fold-hdr">
          <h1>Folderico</h1>
          <p>Customize folder icons — pick a color, add a sticker, set a cover</p>
        </div>
        <div className="fold-ws">
          <div className="fold-pnl">
            <div className="fold-stage">
              <FolderPreview color={color} sticker={sticker} coverImage={coverImage} size={180}
                stickerX={stickerX} stickerY={stickerY} stickerScale={stickerScale}
                onStickerMove={(x, y) => { setStickerX(x); setStickerY(y); }} onStickerScale={setStickerScale}/>
              {sticker && <div className="fold-stage-hint">Drag sticker · corner to resize · scroll to scale</div>}
            </div>
            <div className="fold-szs">
              {[64,128,256,512].map(s=>(
                <button key={s} className={`fold-szo ${exportSize===s?"a":""}`} onClick={()=>setExportSize(s)}>{s}</button>
              ))}
            </div>
            <div className="fold-erow">
              <button className="fold-btn fold-bp" onClick={()=>doExport("png")} disabled={isExporting}>{isExporting?"…":"Download PNG"}</button>
              <button className="fold-btn fold-bs" onClick={()=>doExport("ico")} disabled={isExporting}>{isExporting?"…":"Download .ICO"}</button>
            </div>
            <div className="fold-erow">
              <button className="fold-btn fold-bs" onClick={()=>{ setShowSaveForm(true); setActiveTab("presets"); }}>Save as template</button>
              <button className="fold-btn fold-bg" onClick={reset}>Reset</button>
            </div>
          </div>

          <div className="fold-ctrl">
            <div className="fold-tbar">
              {tabs.map(t=><button key={t.id} className={`fold-tb ${activeTab===t.id?"a":""}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>)}
            </div>
            <div className="fold-tc">
              {activeTab==="color" && <>
                <div className="fold-sl">Palette</div>
                <div className="fold-cg">
                  {PALETTE.map(c=><button key={c} className={`fold-cs ${color===c?"a":""}`} style={{background:c}} onClick={()=>setColor(c)}/>)}
                </div>
                <div className="fold-sl">Custom</div>
                <div className="fold-ccr">
                  <input type="color" value={color} onChange={e=>setColor(e.target.value)}/>
                  <span className="fold-hx">{color.toUpperCase()}</span>
                </div>
              </>}
              {activeTab==="sticker" && <>
                <input className="fold-esrch" type="text" placeholder="Search emojis…" value={emojiSearch} onChange={e=>setEmojiSearch(e.target.value)}/>
                {!emojiSearch && (
                  <div className="fold-cbar">
                    {catKeys.map(cat=><button key={cat} className={`fold-cb ${emojiCat===cat?"a":""}`} onClick={()=>setEmojiCat(cat)}>{cat}</button>)}
                  </div>
                )}
                <div className="fold-eg">
                  {filteredEmojis.map((e,i)=>(
                    <button key={`${e}-${i}`} className={`fold-eb ${sticker===e?"a":""}`} onClick={()=>{
                      if (sticker === e) setSticker(null);
                      else { setSticker(e); setStickerX(0.78); setStickerY(0.75); setStickerScale(1); }
                    }}>{e}</button>
                  ))}
                  {filteredEmojis.length===0 && <div style={{gridColumn:"span 8",textAlign:"center",color:"#5a5a6e",padding:"24px 0",fontSize:"13px"}}>No emojis found</div>}
                </div>
                {sticker && <button className="fold-clr" onClick={()=>setSticker(null)}>Remove sticker</button>}
              </>}
              {activeTab==="cover" && <>
                <div className="fold-sl">Folder cover image</div>
                <div className={`fold-cu ${coverImage?"hi":""}`} onClick={()=>fileInputRef.current?.click()}>
                  {coverImage ? <img src={coverImage} alt="Cover"/> : <div className="fold-cut"><span>Click to upload</span> an image<br/>JPG, PNG, or WebP</div>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}}/>
                {coverImage && <button className="fold-btn fold-bg" style={{marginTop:10,width:"100%"}} onClick={()=>{setCoverImage(null);setCoverImageObj(null);}}>Remove cover</button>}
              </>}
              {activeTab==="presets" && <>
                {showSaveForm && (
                  <div style={{marginBottom:16}}>
                    <div className="fold-sl">Save current as template</div>
                    <div className="fold-save-row">
                      <input className="fold-save-input" type="text" placeholder="Template name…" value={saveName}
                        onChange={e=>setSaveName(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") handleSaveTemplate(); }}/>
                      <button className="fold-btn fold-bp" style={{flex:"unset",padding:"8px 20px"}} onClick={handleSaveTemplate}>Save</button>
                      <button className="fold-btn fold-bg" style={{flex:"unset"}} onClick={()=>{setShowSaveForm(false);setSaveName("");}}>Cancel</button>
                    </div>
                  </div>
                )}
                {customPresets.length > 0 && <>
                  <div className="fold-sl">My Templates</div>
                  <div className="fold-pg" style={{marginBottom:16}}>
                    {customPresets.map(p=>(
                      <button key={p.id} className="fold-pc" onClick={()=>handleApplyTemplate(p)}>
                        <div className="fold-pd" style={{background:p.color+"22",color:p.color}}>{p.sticker||"📁"}</div>
                        <span className="fold-pl">{p.name}</span>
                        <span className="fold-del-btn" onClick={e=>{e.stopPropagation();handleDeleteTemplate(p.id);}}>✕</span>
                      </button>
                    ))}
                  </div>
                </>}
                {!showSaveForm && <button className="fold-clr" style={{marginTop:0,marginBottom:16}} onClick={()=>setShowSaveForm(true)}>+ Save current design as template</button>}
                <div className="fold-sep"/>
                <div className="fold-sl">Built-in Presets</div>
                <div className="fold-pg">
                  {BUILT_IN_PRESETS.map(p=>(
                    <button key={p.name} className="fold-pc" onClick={()=>handleApplyTemplate(p)}>
                      <div className="fold-pd" style={{background:p.color+"22",color:p.color}}>{p.sticker}</div>
                      <span className="fold-pl">{p.name}</span>
                    </button>
                  ))}
                </div>
              </>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
