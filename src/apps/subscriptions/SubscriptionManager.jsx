import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// ===================================================================
//  HELPERS
// ===================================================================

let _c = 0;
const genId = (prefix) => `${prefix}_${Date.now().toString(36)}_${++_c}`;

const DEFAULT_TAGS = [
  { id: 'tag_streaming', name: 'Streaming', color: '#e53935' },
  { id: 'tag_software',  name: 'Software',  color: '#448aff' },
  { id: 'tag_music',     name: 'Music',     color: '#ab47bc' },
];

const PERIOD_LABEL = { monthly: 'Monthly', yearly: 'Yearly' };

// Currency formatting — defaults to EUR/fr-FR but tries to follow the user's locale.
// Stored as a constant so it's cheap to call repeatedly.
const fmt = new Intl.NumberFormat(
  typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'fr-FR',
  { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }
);
const formatCurrency = (n) => fmt.format(Number(n) || 0);

// Compact form for filter pills — no decimals, less visual noise.
const fmtShort = new Intl.NumberFormat(
  typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'fr-FR',
  { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }
);
const formatCurrencyShort = (n) => fmtShort.format(Number(n) || 0);

// Short month-day for the canceled stamp (e.g. "12 Apr").
function formatShortDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(
      typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'fr-FR',
      { day: 'numeric', month: 'short' }
    );
  } catch { return ''; }
}

// Returns the monthly-equivalent price for a single sub.
function monthlyEquiv(s) {
  const price = Number(s.price) || 0;
  return s.period === 'yearly' ? price / 12 : price;
}

// Parse a 'YYYY-MM-DD' string as LOCAL midnight (the Date constructor
// would otherwise read it as UTC and shift the day in some timezones).
function parseLocalDate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

// Returns the effective next-billing Date, rolling forward from any past
// date by the subscription's period. So a `nextBilling` of "2024-03-15"
// on a monthly sub will roll forward month-by-month until it's ≥ today.
function getNextBillingDate(sub) {
  const d = parseLocalDate(sub.nextBilling);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Cap iterations as a safety belt — should never trigger in practice.
  let guard = 1000;
  while (d.getTime() < today.getTime() && guard-- > 0) {
    if (sub.period === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
  }
  return d;
}

// Whole-day delta between a Date and today, ignoring time-of-day.
function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(date);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - today.getTime()) / 86400000);
}

// Human label for the renewal chip: "Today", "Tomorrow", "in 5 days",
// or a short date for anything > 30 days out.
function formatRenewalLabel(date) {
  const n = daysUntil(date);
  if (n <= 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n <= 30) return `in ${n} days`;
  return formatShortDate(date.toISOString());
}

// Tier (used for color): 'urgent' (≤3 days), 'soon' (4–7 days), or 'normal'.
function renewalUrgency(date) {
  const n = daysUntil(date);
  if (n <= 3) return 'urgent';
  if (n <= 7) return 'soon';
  return 'normal';
}

// Returns { monthly, yearly } given a list of subs. Canceled subs are ignored.
function computeTotals(subscriptions) {
  let monthly = 0;
  let yearly = 0;
  for (const s of subscriptions) {
    if (s.canceledAt) continue;
    const price = Number(s.price) || 0;
    if (s.period === 'yearly') {
      yearly += price;
      monthly += price / 12;
    } else {
      monthly += price;
      yearly += price * 12;
    }
  }
  return { monthly, yearly };
}

// ===================================================================
//  ICONS
// ===================================================================

const ICO = {
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  tag:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  x:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  receipt: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 1V2H4z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>,
  chev: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  restore: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  cal: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

// First letter of the service name in a colored square — same idea as BookmarkManager's LetterAvatar
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 55%)`;
}

function ServiceAvatar({ name }) {
  const letter = (name || '?').trim()[0]?.toUpperCase() || '?';
  const bg = stringToColor(name || '?');
  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1, fontFamily: 'var(--font-body)', flexShrink: 0 }}>
      {letter}
    </div>
  );
}

// ===================================================================
//  TAG MANAGER DIALOG
// ===================================================================

function TagManagerDialog({ tags, onAdd, onUpdate, onDelete, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#448aff');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const inputRef = useRef(null);

  const handleAdd = () => {
    const n = name.trim();
    if (!n) return;
    if (tags.some(t => t.name.toLowerCase() === n.toLowerCase())) return;
    onAdd({ name: n, color });
    setName('');
    setColor('#448aff');
    inputRef.current?.focus();
  };

  const startEdit = (tag) => {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    onUpdate(editId, { name: editName.trim(), color: editColor });
    setEditId(null);
  };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.dialog} onClick={e => e.stopPropagation()}>
        <div style={S.dialogHeader}>
          <h3 style={S.dialogTitle}>{ICO.tag} Manage Categories</h3>
          <button style={S.iconBtn} onClick={onClose}>{ICO.x}</button>
        </div>

        {/* Add form */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-secondary)' }}>
          <div style={S.addTagRow}>
            <input ref={inputRef} style={{ ...S.input, marginBottom: 0 }} value={name} onChange={e => setName(e.target.value)}
              placeholder="Category name…" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <div style={S.colorInputWrap}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={S.colorPicker} />
              <input
                style={{ ...S.input, width: 90, fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center', marginBottom: 0 }}
                value={color}
                onChange={e => {
                  const v = e.target.value;
                  if (/^#?[0-9a-fA-F]{0,6}$/.test(v.replace('#', ''))) setColor(v.startsWith('#') ? v : '#' + v);
                }}
                placeholder="#hex" maxLength={7}
              />
            </div>
            <button style={S.accentBtn} onClick={handleAdd}>Add</button>
          </div>
        </div>

        {/* Tag list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px', minHeight: 0 }}>
          {tags.length === 0 && <p style={S.emptyText}>No categories yet. Create one above.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tags.map(tag => (
              <div key={tag.id} style={S.tagRow}>
                {editId === tag.id ? (
                  <>
                    <input style={{ ...S.input, flex: 1, marginBottom: 0 }} value={editName} onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }} autoFocus />
                    <div style={S.colorInputWrap}>
                      <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={S.colorPicker} />
                      <input style={{ ...S.input, width: 80, fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 0 }}
                        value={editColor} onChange={e => setEditColor(e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value)} maxLength={7} />
                    </div>
                    <button style={S.smallAccentBtn} onClick={saveEdit}>Save</button>
                    <button style={S.smallBtn} onClick={() => setEditId(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ ...S.tagDot, background: tag.color }} />
                    <span style={S.tagName}>{tag.name}</span>
                    <span style={S.tagHex}>{tag.color}</span>
                    <div style={{ flex: 1 }} />
                    <button style={S.smallBtn} onClick={() => startEdit(tag)} title="Edit">{ICO.edit}</button>
                    <button style={{ ...S.smallBtn, color: '#d04040' }} onClick={() => {
                      if (confirm(`Delete category "${tag.name}"? Subscriptions in this category will keep the data but no longer be tagged.`)) onDelete(tag.id);
                    }} title="Delete">{ICO.trash}</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
//  ADD / EDIT SUBSCRIPTION DIALOG
// ===================================================================

function SubscriptionDialog({ subscription, tags, onSave, onClose, onOpenTagManager }) {
  const isEdit = subscription?.id != null;
  const [name, setName]     = useState(subscription?.name || '');
  const [tagId, setTagId]   = useState(subscription?.tagId || '');
  const [period, setPeriod] = useState(subscription?.period || 'monthly');
  const [priceStr, setPriceStr] = useState(
    subscription?.price != null ? String(subscription.price) : ''
  );
  const [notes, setNotes] = useState(subscription?.notes || '');
  const [nextBilling, setNextBilling] = useState(subscription?.nextBilling || '');

  const canSave = name.trim().length > 0 && priceStr.trim().length > 0 && !isNaN(parseFloat(priceStr));

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      tagId: tagId || null,
      period,
      price: parseFloat(priceStr),
      notes: notes.trim(),
      nextBilling: nextBilling || null,
    });
  };

  // Submit on Enter (except inside the price input where it's already handled by canSave)
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && canSave) handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.dialog} onClick={e => e.stopPropagation()}>
        <div style={S.dialogHeader}>
          <h3 style={S.dialogTitle}>{ICO.receipt} {isEdit ? 'Edit Subscription' : 'Add Subscription'}</h3>
          <button style={S.iconBtn} onClick={onClose}>{ICO.x}</button>
        </div>

        <div style={S.dialogBody}>
          <label style={S.label}>Service name</label>
          <input style={S.input} value={name} onChange={e => setName(e.target.value)}
            placeholder="Netflix, Spotify, Notion…" autoFocus onKeyDown={onKeyDown} />

          <label style={S.label}>
            Category
            <button type="button" style={S.linkBtn} onClick={onOpenTagManager}>+ manage</button>
          </label>
          <div style={S.selectWrap}>
            <select style={S.select} value={tagId} onChange={e => setTagId(e.target.value)}>
              <option value="">— No category —</option>
              {tags.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <span style={S.selectChev}>{ICO.chev}</span>
          </div>

          <div style={S.row2}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Billing period</label>
              <div style={S.selectWrap}>
                <select style={S.select} value={period} onChange={e => setPeriod(e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <span style={S.selectChev}>{ICO.chev}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Price (€)</label>
              <input
                type="number" step="0.01" min="0"
                style={S.input}
                value={priceStr}
                onChange={e => setPriceStr(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="9.99"
              />
            </div>
          </div>

          <label style={S.label}>
            Next billing date <span style={S.optional}>(optional)</span>
          </label>
          <input
            type="date"
            style={S.input}
            value={nextBilling}
            onChange={e => setNextBilling(e.target.value)}
            onKeyDown={onKeyDown}
          />

          <label style={S.label}>
            Notes <span style={S.optional}>(optional)</span>
          </label>
          <textarea
            style={{ ...S.input, minHeight: 60, resize: 'vertical', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Renewal date, shared with…, promo expires Sept 2026"
            rows={2}
          />

          <div style={S.dialogActions}>
            <button style={S.ghostBtn} onClick={onClose}>Cancel</button>
            <button style={{ ...S.accentBtn, opacity: canSave ? 1 : 0.4, pointerEvents: canSave ? 'auto' : 'none' }} onClick={handleSave}>
              {isEdit ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
//  SUBSCRIPTION ROW
// ===================================================================

function SubscriptionRow({ sub, tag, onEdit, onCancel, onRestore, onPermanentDelete }) {
  // Per-period equivalent for sorting/display (month-equivalent)
  const mEquiv = monthlyEquiv(sub);
  const isCanceled = !!sub.canceledAt;

  // Renewal date is hidden for canceled subs (they have no next charge).
  const nextDate = !isCanceled ? getNextBillingDate(sub) : null;
  const urgency  = nextDate ? renewalUrgency(nextDate) : null;
  const renewalStyle = urgency === 'urgent'
    ? S.renewalChipUrgent
    : urgency === 'soon'
      ? S.renewalChipSoon
      : S.renewalChipNormal;

  // Subtle left-edge accent on the row when something renews soon.
  // Using an inset box-shadow rather than a thicker left border so the
  // row's content doesn't shift horizontally between states.
  const rowAccent = urgency === 'urgent'
    ? { boxShadow: 'inset 3px 0 0 #d04040' }
    : urgency === 'soon'
      ? { boxShadow: 'inset 3px 0 0 var(--accent)' }
      : {};

  return (
    <div style={{ ...S.row, ...rowAccent, ...(isCanceled ? S.rowCanceled : {}) }}>
      <ServiceAvatar name={sub.name} />

      <div style={S.rowInfo}>
        <div style={{ ...S.rowTitle, ...(isCanceled ? { textDecoration: 'line-through' } : {}) }}>
          {sub.name}
        </div>
        <div style={S.rowMeta}>
          {tag ? (
            <span style={{
              ...S.miniTag,
              background: tag.color + '22',
              borderColor: tag.color,
              color: tag.color,
            }}>
              <span style={{ ...S.tagDot, width: 7, height: 7, background: tag.color }} />
              {tag.name}
            </span>
          ) : (
            <span style={{ ...S.miniTag, background: 'transparent', borderColor: 'var(--border-primary)', color: 'var(--text-tertiary)' }}>
              uncategorized
            </span>
          )}
          {isCanceled ? (
            <span style={S.canceledStamp}>
              Canceled {formatShortDate(sub.canceledAt)}
            </span>
          ) : (
            <span style={S.periodPill}>
              {PERIOD_LABEL[sub.period] || sub.period}
            </span>
          )}
          {nextDate && (
            <span style={{ ...S.renewalChip, ...renewalStyle }}>
              {ICO.cal} Renews {formatRenewalLabel(nextDate)}
            </span>
          )}
        </div>
        {sub.notes && (
          <div style={S.notesBlock}>{sub.notes}</div>
        )}
      </div>

      <div style={S.rowPrice}>
        <div style={S.priceMain}>{formatCurrency(sub.price)}</div>
        <div style={S.priceSub}>
          {sub.period === 'yearly'
            ? <>≈ {formatCurrency(mEquiv)} <span style={{ opacity: 0.6 }}>/mo</span></>
            : <>≈ {formatCurrency(mEquiv * 12)} <span style={{ opacity: 0.6 }}>/yr</span></>
          }
        </div>
      </div>

      <div style={S.rowActions}>
        {isCanceled ? (
          <>
            <button style={{ ...S.smallBtn, color: 'var(--accent)' }} onClick={onRestore} title="Restore subscription">
              {ICO.restore}
            </button>
            <button style={{ ...S.smallBtn, color: '#d04040' }} onClick={onPermanentDelete} title="Delete permanently">
              {ICO.trash}
            </button>
          </>
        ) : (
          <>
            <button style={S.smallBtn} onClick={onEdit} title="Edit">{ICO.edit}</button>
            <button style={{ ...S.smallBtn, color: '#d04040' }} onClick={onCancel} title="Cancel subscription">
              {ICO.trash}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ===================================================================
//  MAIN
// ===================================================================

export default function SubscriptionManager({ initialData, onDataChange }) {
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filterTagId, setFilterTagId] = useState('all'); // 'all' | tagId | 'none'
  const [viewCanceled, setViewCanceled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [toast, setToast] = useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  // ── Hydrate from cloud once ──
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current || !initialData) return;
    if (initialData.tags?.length) setTags(initialData.tags);
    if (initialData.subscriptions?.length) setSubscriptions(initialData.subscriptions);
    hydrated.current = true;
  }, [initialData]);

  // ── Push every change up so the cloud-sync hook can debounce-save ──
  useEffect(() => {
    onDataChange?.({ tags, subscriptions });
  }, [tags, subscriptions, onDataChange]);

  // ── Tag CRUD ──
  const addTag    = useCallback((tag) => setTags(prev => [...prev, { id: genId('tag'), ...tag }]), []);
  const updateTag = useCallback((id, patch) => setTags(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t)), []);
  const deleteTag = useCallback((id) => {
    setTags(prev => prev.filter(t => t.id !== id));
    setSubscriptions(prev => prev.map(s => s.tagId === id ? { ...s, tagId: null } : s));
  }, []);

  // ── Subscription CRUD ──
  const addSubscription = useCallback((data) => {
    setSubscriptions(prev => [{ id: genId('sub'), ...data, dateAdded: new Date().toISOString() }, ...prev]);
    flash('Subscription added');
  }, []);
  const updateSubscription = useCallback((id, data) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    flash('Subscription updated');
  }, []);
  // Soft delete — flips the canceledAt flag, keeps the row.
  const cancelSubscription = useCallback((id) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, canceledAt: new Date().toISOString() } : s));
    flash('Canceled — open the Canceled view to restore');
  }, []);
  // Restore — clears the canceledAt flag.
  const restoreSubscription = useCallback((id) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, canceledAt: null } : s));
    flash('Restored');
  }, []);
  // Hard delete — confirm first since this is irreversible.
  const permanentlyDeleteSubscription = useCallback((id) => {
    const sub = subscriptions.find(s => s.id === id);
    if (sub && !confirm(`Permanently delete "${sub.name}"? This cannot be undone.`)) return;
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    flash('Deleted permanently');
  }, [subscriptions]);

  // ── Stats ── (computeTotals already skips canceled internally)
  const totals = useMemo(() => computeTotals(subscriptions), [subscriptions]);

  // ── Active vs canceled counts ──
  const activeCount   = useMemo(() => subscriptions.filter(s => !s.canceledAt).length, [subscriptions]);
  const canceledCount = useMemo(() => subscriptions.filter(s =>  s.canceledAt).length, [subscriptions]);

  // ── Per-tag breakdown for the filter pills (count + monthly-equiv total) — actives only ──
  const tagStats = useMemo(() => {
    const stats = {};
    for (const t of tags) stats[t.id] = { count: 0, monthly: 0 };
    let noneCount = 0, noneMonthly = 0;
    for (const s of subscriptions) {
      if (s.canceledAt) continue;
      const m = monthlyEquiv(s);
      if (s.tagId && stats[s.tagId]) {
        stats[s.tagId].count += 1;
        stats[s.tagId].monthly += m;
      } else {
        noneCount += 1;
        noneMonthly += m;
      }
    }
    return { byTag: stats, none: { count: noneCount, monthly: noneMonthly } };
  }, [subscriptions, tags]);

  // ── Filtering + sorting (most expensive subs first by monthly-equivalent) ──
  const filtered = useMemo(() => {
    // Step 1: active vs canceled view
    let list = subscriptions.filter(s => viewCanceled ? !!s.canceledAt : !s.canceledAt);
    // Step 2: category filter (only meaningful in the active view)
    if (!viewCanceled) {
      if (filterTagId === 'none') list = list.filter(s => !s.tagId);
      else if (filterTagId !== 'all') list = list.filter(s => s.tagId === filterTagId);
    }
    // Step 3: search — case-insensitive substring on name + notes + tag name
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(s => {
        const tagName = s.tagId ? (tags.find(t => t.id === s.tagId)?.name || '') : '';
        return (
          s.name.toLowerCase().includes(q) ||
          (s.notes || '').toLowerCase().includes(q) ||
          tagName.toLowerCase().includes(q)
        );
      });
    }
    // Step 4: sort by monthly equivalent, descending
    return [...list].sort((a, b) => monthlyEquiv(b) - monthlyEquiv(a));
  }, [subscriptions, filterTagId, viewCanceled, searchQuery, tags]);

  const tagById = useMemo(() => Object.fromEntries(tags.map(t => [t.id, t])), [tags]);

  return (
    <div style={S.root}>
      {/* ── Top bar ── */}
      <div style={S.topbar}>
        <div style={S.topLeft}>
          <span style={{ fontSize: 20 }}>{ICO.receipt}</span>
          <span style={S.appName}>Subscriptions</span>
          {activeCount > 0 && (
            <span style={S.badge}>{activeCount} {activeCount === 1 ? 'service' : 'services'}</span>
          )}
        </div>
        <div style={S.topActions}>
          <button style={S.outlineBtn} onClick={() => setShowTagManager(true)}>
            {ICO.tag} Manage Categories
          </button>
          <button style={S.accentBtn} onClick={() => setShowAddDialog(true)}>
            {ICO.plus} Add Subscription
          </button>
        </div>
      </div>

      {/* ── Stats card ── */}
      <div style={S.statsWrap}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Monthly</div>
          <div style={S.statValue}>{formatCurrency(totals.monthly)}</div>
          <div style={S.statHint}>across {activeCount} active {activeCount === 1 ? 'service' : 'services'}</div>
        </div>
        <div style={{ ...S.statCard, ...S.statCardAccent }}>
          <div style={S.statLabel}>Yearly</div>
          <div style={S.statValue}>{formatCurrency(totals.yearly)}</div>
          <div style={S.statHint}>annualized total</div>
        </div>
      </div>

      {/* ── Search + Filter row ── */}
      {subscriptions.length > 0 && (
        <div style={S.controlsRow}>
          {/* Search input — always visible when there are subs */}
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>{ICO.search}</span>
            <input
              type="text"
              style={S.searchInput}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, or notes…"
            />
            {searchQuery && (
              <button style={S.searchClear} onClick={() => setSearchQuery('')} title="Clear search">
                {ICO.x}
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div style={S.filterRow}>
            {viewCanceled ? (
              // In the canceled view, only show a single "back to active" pill.
              <button
                onClick={() => { setViewCanceled(false); setFilterTagId('all'); }}
                style={{ ...S.filterPill, ...S.filterPillActive }}
              >
                ← Back to active
              </button>
            ) : (
              <>
                <button
                  onClick={() => setFilterTagId('all')}
                  style={{ ...S.filterPill, ...(filterTagId === 'all' ? S.filterPillActive : {}) }}
                >
                  All
                  <span style={S.filterTotal}>{formatCurrencyShort(totals.monthly)}</span>
                  <span style={S.filterCount}>{activeCount}</span>
                </button>
                {tags.map(tag => {
                  const s = tagStats.byTag[tag.id];
                  if (!s || s.count === 0) return null;
                  const active = filterTagId === tag.id;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setFilterTagId(tag.id)}
                      style={{
                        ...S.filterPill,
                        ...(active ? { background: tag.color + '20', borderColor: tag.color, color: tag.color } : {}),
                      }}
                    >
                      <span style={{ ...S.tagDot, background: tag.color, width: 7, height: 7 }} />
                      {tag.name}
                      <span style={S.filterTotal}>{formatCurrencyShort(s.monthly)}</span>
                      <span style={S.filterCount}>{s.count}</span>
                    </button>
                  );
                })}
                {tagStats.none.count > 0 && (
                  <button
                    onClick={() => setFilterTagId('none')}
                    style={{ ...S.filterPill, ...(filterTagId === 'none' ? S.filterPillActive : {}) }}
                  >
                    Uncategorized
                    <span style={S.filterTotal}>{formatCurrencyShort(tagStats.none.monthly)}</span>
                    <span style={S.filterCount}>{tagStats.none.count}</span>
                  </button>
                )}
                {canceledCount > 0 && (
                  <button
                    onClick={() => { setViewCanceled(true); setFilterTagId('all'); }}
                    style={{ ...S.filterPill, ...S.filterPillCanceled }}
                    title="Show canceled subscriptions"
                  >
                    {ICO.trash}
                    Canceled <span style={S.filterCount}>{canceledCount}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Subscription list ── */}
      <div style={S.content}>
        {subscriptions.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>{ICO.receipt}</div>
            <h3 style={S.emptyTitle}>No subscriptions yet</h3>
            <p style={S.emptyDesc}>
              Click <strong>Add Subscription</strong> to start tracking your monthly and yearly services.
            </p>
            <button style={{ ...S.accentBtn, marginTop: 8 }} onClick={() => setShowAddDialog(true)}>
              {ICO.plus} Add your first subscription
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <p style={S.emptyDesc}>
              {searchQuery
                ? <>No matches for <strong>“{searchQuery}”</strong>.</>
                : viewCanceled
                  ? 'No canceled subscriptions.'
                  : 'No subscriptions in this category.'}
            </p>
          </div>
        ) : (
          filtered.map(sub => (
            <SubscriptionRow
              key={sub.id}
              sub={sub}
              tag={sub.tagId ? tagById[sub.tagId] : null}
              onEdit={() => setEditingSub(sub)}
              onCancel={() => cancelSubscription(sub.id)}
              onRestore={() => restoreSubscription(sub.id)}
              onPermanentDelete={() => permanentlyDeleteSubscription(sub.id)}
            />
          ))
        )}
      </div>

      {/* ── Dialogs ── */}
      {showAddDialog && (
        <SubscriptionDialog
          tags={tags}
          onSave={(data) => { addSubscription(data); setShowAddDialog(false); }}
          onClose={() => setShowAddDialog(false)}
          onOpenTagManager={() => { setShowAddDialog(false); setShowTagManager(true); }}
        />
      )}
      {editingSub && (
        <SubscriptionDialog
          subscription={editingSub}
          tags={tags}
          onSave={(data) => { updateSubscription(editingSub.id, data); setEditingSub(null); }}
          onClose={() => setEditingSub(null)}
          onOpenTagManager={() => { setEditingSub(null); setShowTagManager(true); }}
        />
      )}
      {showTagManager && (
        <TagManagerDialog
          tags={tags}
          onAdd={addTag}
          onUpdate={updateTag}
          onDelete={deleteTag}
          onClose={() => setShowTagManager(false)}
        />
      )}

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

// ===================================================================
//  STYLES
// ===================================================================

const S = {
  root: {
    flex: 1, display: 'flex', flexDirection: 'column',
    minHeight: 0, overflow: 'hidden',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
  },

  // ── Top bar ──
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', background: 'var(--bg-toolbar)',
    borderBottom: '1px solid var(--border-secondary)', flexShrink: 0, gap: 12, flexWrap: 'wrap',
  },
  topLeft:    { display: 'flex', alignItems: 'center', gap: 10 },
  topActions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  appName:    { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--text-primary)' },
  badge: {
    fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
    padding: '2px 8px', borderRadius: 99, background: 'var(--accent-subtle)', color: 'var(--accent)',
  },

  // ── Stats ──
  statsWrap: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    padding: '20px 20px 12px', flexShrink: 0,
  },
  statCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-lg)', padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 4,
    boxShadow: 'var(--shadow-sm)',
  },
  statCardAccent: {
    background: 'linear-gradient(135deg, var(--accent-surface) 0%, var(--bg-surface) 70%)',
    borderColor: 'var(--accent-subtle)',
  },
  statLabel: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  },
  statValue: {
    fontSize: 30, fontWeight: 600, fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1,
  },
  statHint: {
    fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2,
  },

  // ── Search + filter controls row ──
  controlsRow: {
    display: 'flex', flexDirection: 'column', gap: 10,
    padding: '0 20px 12px', flexShrink: 0,
  },
  searchWrap: {
    position: 'relative', display: 'flex', alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)', pointerEvents: 'none', display: 'flex',
  },
  searchInput: {
    width: '100%', padding: '7px 32px 7px 32px', fontSize: 13,
    border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'border-color 150ms',
  },
  searchClear: {
    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'var(--text-tertiary)',
    cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
  },

  // ── Filter row ──
  filterRow: {
    display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0,
  },
  filterPill: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
    fontSize: 12, fontWeight: 500, borderRadius: 99, cursor: 'pointer',
    border: '1px solid var(--border-primary)', background: 'transparent',
    color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
    transition: 'all 120ms',
  },
  filterPillActive: {
    background: 'var(--accent-subtle)', borderColor: 'var(--accent)', color: 'var(--accent)',
  },
  filterPillCanceled: {
    marginLeft: 'auto',  // push to the right edge of the row
    color: 'var(--text-tertiary)',
    borderStyle: 'dashed',
  },
  filterCount: {
    fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
    padding: '0 5px', borderRadius: 4, background: 'var(--bg-secondary)',
    color: 'var(--text-tertiary)', marginLeft: 2,
  },
  filterTotal: {
    fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
    color: 'inherit', opacity: 0.75, marginLeft: 4,
  },

  // ── List ──
  content: {
    flex: '1 1 0', height: 0, overflowY: 'auto', padding: '4px 16px 40px',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
    background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-lg)', marginBottom: 8,
    transition: 'border-color 150ms, transform 150ms',
  },
  rowCanceled: {
    opacity: 0.6,
    background: 'var(--bg-secondary)',
    borderStyle: 'dashed',
  },
  canceledStamp: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
    background: 'rgba(208, 64, 64, 0.12)', color: '#d04040',
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  notesBlock: {
    fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)',
    padding: '4px 8px', marginTop: 6, background: 'var(--accent-surface)',
    borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--accent)',
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },
  rowInfo:  { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
  },
  rowMeta:  { display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  miniTag: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
    border: '1px solid', whiteSpace: 'nowrap',
  },
  periodPill: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
    background: 'var(--bg-secondary)', color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  renewalChip: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
    border: '1px solid', whiteSpace: 'nowrap',
    fontFamily: 'var(--font-body)',
  },
  renewalChipNormal: {
    background: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)',
    color: 'var(--text-tertiary)',
  },
  renewalChipSoon: {
    background: 'var(--accent-subtle)', borderColor: 'var(--accent)',
    color: 'var(--accent)',
  },
  renewalChipUrgent: {
    background: 'rgba(208, 64, 64, 0.12)', borderColor: '#d04040',
    color: '#d04040',
  },
  rowPrice: { textAlign: 'right', flexShrink: 0 },
  priceMain: {
    fontSize: 16, fontWeight: 600, color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', lineHeight: 1.2,
  },
  priceSub: {
    fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2,
  },
  rowActions: { display: 'flex', gap: 2, flexShrink: 0 },

  // ── Buttons ──
  accentBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    fontSize: 13, fontWeight: 600, borderRadius: 'var(--radius-md)',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer',
    border: 'none', fontFamily: 'var(--font-body)', transition: 'filter 120ms',
    whiteSpace: 'nowrap',
  },
  outlineBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)',
    background: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
    border: '1px solid var(--border-primary)', fontFamily: 'var(--font-body)',
    transition: 'all 120ms', whiteSpace: 'nowrap',
  },
  ghostBtn: {
    padding: '7px 16px', fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)',
    background: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
    border: 'none', fontFamily: 'var(--font-body)',
  },
  iconBtn: {
    background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
    padding: 4, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
  },
  smallBtn: {
    background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
    padding: '6px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
    transition: 'color 120ms',
  },
  smallAccentBtn: {
    padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer', border: 'none',
    fontFamily: 'var(--font-body)',
  },
  linkBtn: {
    fontSize: 11, fontWeight: 500, color: 'var(--accent)', background: 'none',
    border: 'none', cursor: 'pointer', padding: 0, marginLeft: 8, fontFamily: 'var(--font-body)',
  },

  // ── Dialog ──
  backdrop: {
    position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 2000, background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(3px)', animation: 'fadeIn 150ms ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  dialog: {
    zIndex: 2001, width: 480, maxWidth: '100%',
    background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
    display: 'flex', flexDirection: 'column', animation: 'popIn 200ms ease forwards',
    maxHeight: 'calc(100vh - 64px)', overflow: 'hidden',
  },
  dialogHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid var(--border-secondary)',
  },
  dialogTitle: {
    fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8,
  },
  dialogBody: { padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 },
  dialogActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 },

  // ── Form ──
  label: {
    fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
    display: 'flex', alignItems: 'center', marginBottom: 4,
  },
  optional: { fontWeight: 400, color: 'var(--text-tertiary)' },
  input: {
    width: '100%', padding: '8px 12px', fontSize: 14,
    border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'var(--font-body)', marginBottom: 4, transition: 'border-color 150ms',
  },
  selectWrap: { position: 'relative', marginBottom: 4 },
  select: {
    width: '100%', padding: '8px 32px 8px 12px', fontSize: 14,
    border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'var(--font-body)', cursor: 'pointer',
    appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
  },
  selectChev: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', color: 'var(--text-tertiary)', display: 'flex',
  },
  row2: { display: 'flex', gap: 12 },

  // ── Tag manager ──
  addTagRow: { display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' },
  colorInputWrap: { display: 'flex', alignItems: 'center', gap: 4 },
  colorPicker: {
    width: 30, height: 30, border: 'none', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', padding: 0, background: 'none',
  },
  tagRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-md)',
  },
  tagDot:  { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  tagName: { fontSize: 14, fontWeight: 500, flex: 1 },
  tagHex:  { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' },

  // ── Empty ──
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '64px 24px', gap: 12, textAlign: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 },
  emptyDesc:  { fontSize: 14, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6, maxWidth: 320 },
  emptyText:  { fontSize: 13, color: 'var(--text-tertiary)', margin: 0 },

  // ── Toast ──
  toast: {
    position: 'fixed', bottom: 48, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--accent)', color: '#fff', padding: '8px 20px', borderRadius: 20,
    fontSize: 13, fontWeight: 600, zIndex: 3000, boxShadow: 'var(--shadow-md)',
    whiteSpace: 'nowrap', animation: 'toast 2.2s ease forwards',
  },
};
