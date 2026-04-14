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
  "Objects": ["⌚","📱","💻","⌨️","🖥️","🖨️","💽","💾","💿","📷","📸","📹","🎥","📺","📻","🎙️","🎚️","🎛️","⏰","🕰️","⌛","📡","🔋","🔌","💡","🔦","🕯️","💸","💵","💰","💳","💎","⚖️","🧰","🔧","🔨","🛠️","⚙️","🔫","💣","🔪","🗡️","🛡️","🔮","📿","🧿","💊","💉","🧬","🌡️","🔑","🗝️","🚪","🪑","🛋️","🛏️","🧸","🖼️","🛍️","🛒","🎁","🎈","✉️","📩","📨","📧","💌","📦","📯","📜","📃","📄","📊","📈","📉","📋","📁","📂","📰","📓","📕","📗","📘","📙","📚","📖","🔖","📎","📐","📏","📌","📍","✂️","🖊️","🖋️","✒️","🖌️","🖍️","📝","✏️","🔍","🔎","🔒","🔓"],
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

  // Tab
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

  // Body
  const bg = ctx.createLinearGradient(0,bodyTop,0,bodyTop+bodyH);
  bg.addColorStop(0,lighten(color,20)); bg.addColorStop(1,darken(color,30));
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x0,bodyTop,bodyW,bodyH,r); ctx.fill();
  ctx.restore();

  // Highlight
  ctx.save(); ctx.strokeStyle=lighten(color,40); ctx.globalAlpha=0.35; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(x0+2,bodyTop+2,bodyW-4,bodyH-4,r); ctx.stroke(); ctx.restore();

  // Cover
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

  // Sticker
  if (sticker) {
    const scx = stickerX * sz, scy = stickerY * sz;
    const sr = sz * 0.09 * stickerScale;
    ctx.save(); ctx.globalAlpha=0.85; ctx.fillStyle="white";
    ctx.beginPath(); ctx.arc(scx,scy,sr,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.font=`${sz*0.11*stickerScale}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(sticker,scx,scy); ctx.restore();
  }
}

/* ── Interactive folder preview ── */
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
    return {
      x: ((clientX - rect.left) / rect.width) * size,
      y: ((clientY - rect.top) / rect.height) * size,
    };
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
        const nx = Math.max(0.05, Math.min(0.95, (p.x - dragStart.current.x) / size));
        const ny = Math.max(0.05, Math.min(0.95, (p.y - dragStart.current.y) / size));
        onStickerMove(nx, ny);
      }
      if (resizing.current) {
        const dist = Math.hypot(p.x - scx, p.y - scy);
        const initDist = Math.hypot(dragStart.current.x - scx, dragStart.current.y - scy);
        const newScale = Math.max(0.4, Math.min(2.5, dragStart.current.sx * (dist / Math.max(1, initDist))));
        onStickerScale(newScale);
      }
    };

    const handleUp = () => {
      dragging.current = false;
      resizing.current = false;
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

  // Scroll to resize
  const handleWheel = useCallback((e) => {
    if (!sticker) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    onStickerScale(Math.max(0.4, Math.min(2.5, stickerScale + delta)));
  }, [sticker, stickerScale, onStickerScale]);

  return (
    <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg"
      onWheel={handleWheel} style={{ cursor: sticker ? "default" : "default" }}>
      <defs>
        <linearGradient id="fb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lighten(color,20)}/><stop offset="100%" stopColor={darken(color,30)}/>
        </linearGradient>
        <linearGradient id="ft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lighten(color,10)}/><stop offset="100%" stopColor={darken(color,10)}/>
        </linearGradient>
        <filter id="fs" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy={size*0.014} stdDeviation={size*0.022} floodOpacity="0.18"/>
        </filter>
        {coverImage && <clipPath id="fc"><rect x={size*0.1+6} y={bodyTop+10} width={size*0.8-12} height={bodyH-20} rx={r}/></clipPath>}
      </defs>
      <g filter="url(#fs)">
        <path d={`M${size*0.1+r},${size*0.1} h${size*0.38-r*2} q${r},0 ${r},${r} l${tabH*0.4},${tabH*0.55} q${r*0.5},${r*0.7} ${r*1.5},${r*0.7} h${size*0.8-size*0.38-tabH*0.4-r*3} q${r},0 ${r},${r} v${bodyTop-size*0.1-tabH+r} h${-(size*0.8)} v${-(bodyTop-size*0.1+r)} q0,${-r} ${r},${-r}z`} fill="url(#ft)"/>
        <rect x={size*0.1} y={bodyTop} width={size*0.8} height={bodyH} rx={r} fill="url(#fb)"/>
        <rect x={size*0.1+2} y={bodyTop+2} width={size*0.8-4} height={bodyH-4} rx={r} fill="none" stroke={lighten(color,40)} strokeWidth="1.5" opacity="0.35"/>
        {coverImage && <image href={coverImage} x={size*0.1+6} y={bodyTop+10} width={size*0.8-12} height={bodyH-20} clipPath="url(#fc)" preserveAspectRatio="xMidYMid slice"/>}
      </g>

      {/* Interactive sticker */}
      {sticker && (
        <g>
          {/* Sticker body — draggable */}
          <circle cx={scx} cy={scy} r={sr} fill="white" opacity="0.85"
            style={{ cursor: "grab" }}
            onMouseDown={(e) => handlePointerDown(e, "drag")}
            onTouchStart={(e) => handlePointerDown(e, "drag")}
          />
          <text x={scx} y={scy} textAnchor="middle" dominantBaseline="central" fontSize={fontSize}
            style={{ cursor: "grab", pointerEvents: "none", userSelect: "none" }}>
            {sticker}
          </text>

          {/* Resize handle */}
          <circle cx={scx + sr * 0.75} cy={scy + sr * 0.75} r={Math.max(5, sr * 0.28)}
            fill="rgba(247,201,72,0.9)" stroke="white" strokeWidth="1.5"
            style={{ cursor: "nwse-resize" }}
            onMouseDown={(e) => handlePointerDown(e, "resize")}
            onTouchStart={(e) => handlePointerDown(e, "resize")}
          />
          {/* Resize icon */}
          <g transform={`translate(${scx + sr * 0.75}, ${scy + sr * 0.75})`} style={{ pointerEvents: "none" }}>
            <line x1={-2.5} y1={2.5} x2={2.5} y2={-2.5} stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1={0} y1={2.5} x2={2.5} y2={0} stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </g>
        </g>
      )}
    </svg>
  );
}

/* ── Main ── */
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
  const [loadingPresets, setLoadingPresets] = useState(true);
  const fileInputRef = useRef(null);

  // Load custom presets from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("folderico-presets");
      if (raw) setCustomPresets(JSON.parse(raw));
    } catch { /* no presets yet */ }
    setLoadingPresets(false);
  }, []);

  // Save custom presets to storage
  const savePresets = useCallback(async (presets) => {
    try {
      localStorage.setItem("folderico-presets", JSON.stringify(presets));
    } catch (err) { console.error("Storage error:", err); }
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    if (!saveName.trim()) return;
    const template = {
      id: Date.now().toString(36),
      name: saveName.trim(),
      color,
      sticker,
      stickerX,
      stickerY,
      stickerScale,
      // We don't save cover images (too large for storage)
    };
    const updated = [...customPresets, template];
    setCustomPresets(updated);
    await savePresets(updated);
    setSaveName("");
    setShowSaveForm(false);
  }, [saveName, color, sticker, stickerX, stickerY, stickerScale, customPresets, savePresets]);

  const handleDeleteTemplate = useCallback(async (id) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    await savePresets(updated);
  }, [customPresets, savePresets]);

  const handleApplyTemplate = useCallback((t) => {
    setColor(t.color);
    setSticker(t.sticker || null);
    setStickerX(t.stickerX ?? 0.78);
    setStickerY(t.stickerY ?? 0.75);
    setStickerScale(t.stickerScale ?? 1);
  }, []);

  const filteredEmojis = useMemo(() => {
    if (!emojiSearch.trim()) return EMOJI_CATEGORIES[emojiCat] || [];
    const q = emojiSearch.toLowerCase();
    return Object.values(EMOJI_CATEGORIES).flat().filter(e => e.includes(q));
  }, [emojiCat, emojiSearch]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
          link.download = `folder-icon-${exportSize}.png`;
          link.href = canvas.toDataURL("image/png");
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
    { id:"color", label:"Color" },
    { id:"sticker", label:"Sticker" },
    { id:"cover", label:"Cover" },
    { id:"presets", label:"Presets" },
  ];

  const catKeys = Object.keys(EMOJI_CATEGORIES);

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(145deg,#0f0f12,#1a1a24 50%,#12121a)", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e8e8ed" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .fold-shell{max-width:960px;margin:0 auto;padding:32px 24px 48px}
        .fold-hdr{text-align:center;margin-bottom:36px}
        .fold-hdr h1{font-family:'Space Mono',monospace;font-size:28px;font-weight:700;letter-spacing:-0.5px;background:linear-gradient(135deg,#f7c948,#f59e42 50%,#e53935);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px}
        .fold-hdr p{color:#7a7a8e;font-size:14px;font-weight:300}
        .fold-ws{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start}
        @media(max-width:700px){.fold-ws{grid-template-columns:1fr}}
        .fold-pnl{background:linear-gradient(160deg,#1e1e2a,#16161f);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:36px;display:flex;flex-direction:column;align-items:center;gap:20px;position:sticky;top:24px}
        .fold-stage{width:220px;height:220px;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#22222e 0% 25%,#1a1a26 0% 50%) 50%/20px 20px;border-radius:16px;border:1px solid rgba(255,255,255,0.04);position:relative}
        .fold-stage-hint{position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:10px;color:#4a4a5e;pointer-events:none}
        .fold-erow{display:flex;gap:8px;width:100%}
        .fold-btn{flex:1;padding:10px 16px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px}
        .fold-btn:hover{transform:translateY(-1px)}.fold-btn:active{transform:translateY(0)}
        .bp{background:linear-gradient(135deg,#f7c948,#f59e42);color:#1a1a24}
        .bp:hover{box-shadow:0 4px 20px rgba(247,201,72,0.3)}
        .bs{background:rgba(255,255,255,0.07);color:#c8c8d4;border:1px solid rgba(255,255,255,0.08)}
        .bs:hover{background:rgba(255,255,255,0.12)}
        .bg{background:none;color:#7a7a8e;font-weight:400;font-size:12px;flex:unset}
        .bg:hover{color:#e8e8ed}
        .szs{display:flex;gap:4px;background:rgba(255,255,255,0.04);border-radius:8px;padding:3px}
        .szo{padding:4px 10px;border-radius:6px;border:none;background:none;color:#7a7a8e;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;transition:all 0.15s}
        .szo.a{background:rgba(247,201,72,0.15);color:#f7c948}
        .fold-ctrl{display:flex;flex-direction:column;gap:20px}
        .tbar{display:flex;gap:2px;background:rgba(255,255,255,0.04);border-radius:12px;padding:3px}
        .tb{flex:1;padding:9px 12px;border:none;border-radius:10px;background:none;color:#7a7a8e;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s}
        .tb.a{background:rgba(255,255,255,0.1);color:#e8e8ed}
        .tb:hover:not(.a){color:#a8a8b8}
        .fold-tc{background:linear-gradient(160deg,#1e1e2a,#16161f);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px}
        .sl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;color:#5a5a6e;margin-bottom:12px}
        .cg{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px}
        .cs{aspect-ratio:1;border-radius:10px;border:2px solid transparent;cursor:pointer;transition:all 0.15s;position:relative}
        .cs:hover{transform:scale(1.1)}
        .cs.a{border-color:white;box-shadow:0 0 12px rgba(255,255,255,0.2)}
        .cs.a::after{content:"✓";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.5)}
        .ccr{display:flex;align-items:center;gap:10px}
        .ccr input[type="color"]{width:36px;height:36px;border:none;border-radius:8px;cursor:pointer;background:none;padding:0}
        .ccr input[type="color"]::-webkit-color-swatch-wrapper{padding:2px}
        .ccr input[type="color"]::-webkit-color-swatch{border-radius:6px;border:none}
        .hx{font-family:'Space Mono',monospace;font-size:13px;color:#a8a8b8}
        .esrch{width:100%;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#e8e8ed;font-family:'DM Sans',sans-serif;font-size:13px;margin-bottom:12px;outline:none}
        .esrch:focus{border-color:rgba(247,201,72,0.4)}
        .esrch::placeholder{color:#5a5a6e}
        .cbar{display:flex;gap:2px;overflow-x:auto;margin-bottom:12px;padding-bottom:4px;scrollbar-width:none}
        .cbar::-webkit-scrollbar{display:none}
        .cb{padding:5px 10px;border-radius:8px;border:none;background:rgba(255,255,255,0.04);color:#7a7a8e;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;transition:all 0.15s;flex-shrink:0}
        .cb.a{background:rgba(247,201,72,0.15);color:#f7c948}
        .cb:hover:not(.a){color:#a8a8b8}
        .eg{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;max-height:280px;overflow-y:auto;padding-right:4px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent}
        .eg::-webkit-scrollbar{width:4px}
        .eg::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        .eb{aspect-ratio:1;border-radius:8px;border:2px solid transparent;background:rgba(255,255,255,0.02);cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;transition:all 0.12s;padding:0;line-height:1}
        .eb:hover{background:rgba(255,255,255,0.08);transform:scale(1.15)}
        .eb.a{border-color:#f7c948;background:rgba(247,201,72,0.1)}
        .clr{width:100%;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);padding:7px;color:#7a7a8e;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;margin-top:8px;transition:all 0.15s}
        .clr:hover{background:rgba(255,255,255,0.07);color:#e8e8ed}
        .cu{border:2px dashed rgba(255,255,255,0.1);border-radius:14px;padding:32px;text-align:center;cursor:pointer;transition:all 0.2s;overflow:hidden}
        .cu:hover{border-color:rgba(247,201,72,0.3);background:rgba(247,201,72,0.03)}
        .cu.hi{padding:0;border-style:solid;border-color:rgba(255,255,255,0.08)}
        .cu.hi img{width:100%;height:160px;object-fit:cover;border-radius:12px}
        .cut{color:#5a5a6e;font-size:13px}
        .cut span{color:#f7c948;font-weight:600}
        .pg{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
        .pc{padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.15s;position:relative}
        .pc:hover{background:rgba(255,255,255,0.07);transform:translateY(-1px)}
        .pd{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
        .pl{font-size:13px;font-weight:500}
        .del-btn{position:absolute;top:6px;right:6px;width:18px;height:18px;border-radius:50%;border:none;background:rgba(229,57,53,0.2);color:#e53935;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.15s}
        .pc:hover .del-btn{opacity:1}
        .del-btn:hover{background:rgba(229,57,53,0.4)}
        .save-row{display:flex;gap:8px;width:100%;margin-top:8px}
        .save-input{flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#e8e8ed;font-family:'DM Sans',sans-serif;font-size:13px;outline:none}
        .save-input:focus{border-color:rgba(247,201,72,0.4)}
        .save-input::placeholder{color:#5a5a6e}
        .sep{width:100%;height:1px;background:rgba(255,255,255,0.06);margin:16px 0}
      `}</style>

      <div className="fold-shell">
        <div className="fold-hdr">
          <h1>Folderico</h1>
          <p>Customize folder icons — pick a color, add a sticker, set a cover</p>
        </div>

        <div className="fold-ws">
          <div className="fold-pnl">
            <div className="fold-stage">
              <FolderPreview
                color={color} sticker={sticker} coverImage={coverImage} size={180}
                stickerX={stickerX} stickerY={stickerY} stickerScale={stickerScale}
                onStickerMove={(x, y) => { setStickerX(x); setStickerY(y); }}
                onStickerScale={setStickerScale}
              />
              {sticker && <div className="fold-stage-hint">Drag sticker · corner to resize · scroll to scale</div>}
            </div>
            <div className="szs">
              {[64,128,256,512].map(s=>(
                <button key={s} className={`szo ${exportSize===s?"a":""}`} onClick={()=>setExportSize(s)}>{s}</button>
              ))}
            </div>
            <div className="fold-erow">
              <button className="fold-btn bp" onClick={()=>doExport("png")} disabled={isExporting}>{isExporting?"…":"Download PNG"}</button>
              <button className="fold-btn bs" onClick={()=>doExport("ico")} disabled={isExporting}>{isExporting?"…":"Download .ICO"}</button>
            </div>
            <div className="fold-erow">
              <button className="fold-btn bs" onClick={()=>{ setShowSaveForm(true); setActiveTab("presets"); }}>
                Save as template
              </button>
              <button className="fold-btn bg" onClick={reset}>Reset</button>
            </div>
          </div>

          <div className="fold-ctrl">
            <div className="tbar">
              {tabs.map(t=>(
                <button key={t.id} className={`tb ${activeTab===t.id?"a":""}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
              ))}
            </div>

            <div className="fold-tc">
              {activeTab==="color" && <>
                <div className="sl">Palette</div>
                <div className="cg">
                  {PALETTE.map(c=>(
                    <button key={c} className={`cs ${color===c?"a":""}`} style={{background:c}} onClick={()=>setColor(c)}/>
                  ))}
                </div>
                <div className="sl">Custom</div>
                <div className="ccr">
                  <input type="color" value={color} onChange={e=>setColor(e.target.value)}/>
                  <span className="hx">{color.toUpperCase()}</span>
                </div>
              </>}

              {activeTab==="sticker" && <>
                <input className="esrch" type="text" placeholder="Search emojis…" value={emojiSearch} onChange={e=>setEmojiSearch(e.target.value)}/>
                {!emojiSearch && (
                  <div className="cbar">
                    {catKeys.map(cat=>(
                      <button key={cat} className={`cb ${emojiCat===cat?"a":""}`} onClick={()=>setEmojiCat(cat)}>{cat}</button>
                    ))}
                  </div>
                )}
                <div className="eg">
                  {filteredEmojis.map((e,i)=>(
                    <button key={`${e}-${i}`} className={`eb ${sticker===e?"a":""}`} onClick={()=>{
                      if (sticker === e) { setSticker(null); }
                      else { setSticker(e); setStickerX(0.78); setStickerY(0.75); setStickerScale(1); }
                    }}>{e}</button>
                  ))}
                  {filteredEmojis.length===0 && <div style={{gridColumn:"span 8",textAlign:"center",color:"#5a5a6e",padding:"24px 0",fontSize:"13px"}}>No emojis found</div>}
                </div>
                {sticker && <button className="clr" onClick={()=>setSticker(null)}>Remove sticker</button>}
              </>}

              {activeTab==="cover" && <>
                <div className="sl">Folder cover image</div>
                <div className={`cu ${coverImage?"hi":""}`} onClick={()=>fileInputRef.current?.click()}>
                  {coverImage ? <img src={coverImage} alt="Cover"/> : <div className="cut"><span>Click to upload</span> an image<br/>JPG, PNG, or WebP</div>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}}/>
                {coverImage && <button className="fold-btn bg" style={{marginTop:10,width:"100%"}} onClick={()=>{setCoverImage(null);setCoverImageObj(null);}}>Remove cover</button>}
              </>}

              {activeTab==="presets" && <>
                {/* Save form */}
                {showSaveForm && (
                  <div style={{marginBottom:16}}>
                    <div className="sl">Save current as template</div>
                    <div className="save-row">
                      <input className="save-input" type="text" placeholder="Template name…" value={saveName}
                        onChange={e=>setSaveName(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter") handleSaveTemplate(); }}
                      />
                      <button className="fold-btn bp" style={{flex:"unset",padding:"8px 20px"}} onClick={handleSaveTemplate}>Save</button>
                      <button className="fold-btn bg" style={{flex:"unset"}} onClick={()=>{setShowSaveForm(false);setSaveName("");}}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Custom presets */}
                {customPresets.length > 0 && <>
                  <div className="sl">My Templates</div>
                  <div className="pg" style={{marginBottom:16}}>
                    {customPresets.map(p=>(
                      <button key={p.id} className="pc" onClick={()=>handleApplyTemplate(p)}>
                        <div className="pd" style={{background:p.color+"22",color:p.color}}>{p.sticker||"📁"}</div>
                        <span className="pl">{p.name}</span>
                        <span className="del-btn" onClick={(e)=>{e.stopPropagation();handleDeleteTemplate(p.id);}}>✕</span>
                      </button>
                    ))}
                  </div>
                </>}

                {!showSaveForm && (
                  <button className="clr" style={{marginTop:0,marginBottom:16}} onClick={()=>setShowSaveForm(true)}>
                    + Save current design as template
                  </button>
                )}

                <div className="sep"/>

                <div className="sl">Built-in Presets</div>
                <div className="pg">
                  {BUILT_IN_PRESETS.map(p=>(
                    <button key={p.name} className="pc" onClick={()=>handleApplyTemplate(p)}>
                      <div className="pd" style={{background:p.color+"22",color:p.color}}>{p.sticker}</div>
                      <span className="pl">{p.name}</span>
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
