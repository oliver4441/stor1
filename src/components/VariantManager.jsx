import { useState, useRef, useMemo, useCallback } from 'react';
import {
  Plus,
  X,
  Trash2,
  AlertTriangle,
  Tag,
  Hash,
  Settings2,
  Info,
  ChevronDown
} from 'lucide-react';

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

function getValueAbbreviation(value, label, style) {
  const text =
    style === 'color'
      ? (label || value || '')
      : (value || label || '');
  return text
    .toString()
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 4)
    .toUpperCase();
}

function generateSku(baseSku, attrs, types) {
  const suffix = types
    .filter((t) => t.values && t.values.length > 0)
    .map((t) => {
      const matched = t.values.find((v) => v.value === attrs[t.id]);
      if (!matched) return '';
      return getValueAbbreviation(matched.value, matched.label, t.style);
    })
    .filter(Boolean)
    .join('-');
  return suffix ? `${baseSku}-${suffix}` : baseSku;
}

function generateCombinations(types) {
  const active = types.filter((t) => t.values && t.values.length > 0);
  if (active.length === 0) return [];

  if (active.length === 1) {
    return active[0].values.map((v) => ({ [active[0].id]: v.value }));
  }

  const results = [];
  function backtrack(idx, current) {
    if (idx === active.length) {
      results.push({ ...current });
      return;
    }
    const t = active[idx];
    for (const val of t.values) {
      current[t.id] = val.value;
      backtrack(idx + 1, current);
    }
  }
  backtrack(0, {});
  return results;
}

function attrsMatch(a, b) {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => a[k] === b[k]);
}

function generateItemsFromTypes(types, existingItems, baseSku) {
  const combos = generateCombinations(types);
  return combos.map((combo) => {
    const existing = existingItems.find((item) =>
      attrsMatch(item.attrs, combo)
    );
    if (existing) {
      return { ...existing, attrs: { ...combo } };
    }
    return {
      id: generateId(),
      attrs: { ...combo },
      sku: generateSku(baseSku, combo, types),
      quantity: 0,
      priceAdjustment: 0,
      imageUrl: ''
    };
  });
}

function getCombinationLabel(attrs, types) {
  return types
    .filter(
      (t) => t.values && t.values.length > 0 && attrs[t.id] !== undefined
    )
    .map((t) => {
      const matched = t.values.find((v) => v.value === attrs[t.id]);
      return matched ? matched.label || matched.value : attrs[t.id];
    })
    .join(' / ');
}

// ──────────────────────────────────────────
// Backward compatibility
// ──────────────────────────────────────────

function convertOldToNew(value, baseSku) {
  if (!value) return { types: [], items: [] };

  // Already new format { types, items }
  if (typeof value === 'object' && !Array.isArray(value) && value.types) {
    return value;
  }

  // Array format
  if (Array.isArray(value)) {
    if (value.length === 0) return { types: [], items: [] };

    // If items already have attrs, it's already new-format items
    if (value[0].attrs) {
      return { types: [], items: value };
    }

    // Old format: [{ id, size, color, colorName, sku, quantity, priceAdjustment, imageUrl }]
    const colorMap = new Map();
    const sizeSet = new Set();

    value.forEach((v) => {
      if (v.color) {
        const key = v.color;
        if (!colorMap.has(key)) {
          colorMap.set(key, {
            value: v.color,
            label: v.colorName || v.color
          });
        }
      }
      if (v.size) sizeSet.add(v.size);
    });

    const types = [];
    if (colorMap.size > 0) {
      types.push({
        id: generateId(),
        name: 'Color',
        style: 'color',
        values: Array.from(colorMap.values())
      });
    }
    if (sizeSet.size > 0) {
      types.push({
        id: generateId(),
        name: 'Size',
        style: 'button',
        values: Array.from(sizeSet).map((s) => ({ value: s, label: s }))
      });
    }

    const items = value.map((v) => ({
      id: v.id || generateId(),
      attrs: Object.fromEntries(
        Object.entries({ color: v.color, size: v.size }).filter(
          ([_, val]) => val
        )
      ),
      sku: v.sku || '',
      quantity: v.quantity || 0,
      priceAdjustment: v.priceAdjustment || 0,
      imageUrl: v.imageUrl || ''
    }));

    return { types, items };
  }

  return { types: [], items: [] };
}

// ──────────────────────────────────────────
// Category presets
// ──────────────────────────────────────────

function getCategoryPresets(category) {
  if (!category) return [];
  const cat = category.toLowerCase();

  if (
    /clothing|t.?shirt|shirt|pants|jeans|jacket|coat|dress|skirt|shorts|hoodie|sweater|blouse|suit|uniform/i.test(
      cat
    )
  ) {
    return [
      {
        id: generateId(),
        name: 'Size',
        style: 'button',
        values: [
          { value: 'XS', label: 'XS' },
          { value: 'S', label: 'S' },
          { value: 'M', label: 'M' },
          { value: 'L', label: 'L' },
          { value: 'XL', label: 'XL' }
        ]
      },
      { id: generateId(), name: 'Color', style: 'color', values: [] }
    ];
  }

  if (/shoe|footwear|sneaker|boot|sandals?/i.test(cat)) {
    return [
      {
        id: generateId(),
        name: 'Size',
        style: 'button',
        values: [
          { value: '38', label: '38' },
          { value: '39', label: '39' },
          { value: '40', label: '40' },
          { value: '41', label: '41' },
          { value: '42', label: '42' },
          { value: '43', label: '43' },
          { value: '44', label: '44' }
        ]
      },
      { id: generateId(), name: 'Color', style: 'color', values: [] }
    ];
  }

  if (
    /electronic|phone|laptop|tablet|computer|gadget|tech|digital|storage/i.test(
      cat
    )
  ) {
    return [
      {
        id: generateId(),
        name: 'Storage',
        style: 'button',
        values: [
          { value: '64GB', label: '64GB' },
          { value: '128GB', label: '128GB' },
          { value: '256GB', label: '256GB' }
        ]
      },
      { id: generateId(), name: 'Color', style: 'color', values: [] }
    ];
  }

  if (
    /perfume|fragrance|cosmetic|beauty|skincare|makeup|cologne|deodorant|body.?spray/i.test(
      cat
    )
  ) {
    return [
      {
        id: generateId(),
        name: 'Size',
        style: 'button',
        values: [
          { value: '30ml', label: '30ml' },
          { value: '50ml', label: '50ml' },
          { value: '100ml', label: '100ml' }
        ]
      }
    ];
  }

  if (
    /watch|timepiece|bracelet|necklace|jewelry|accessory|ring|earring/i.test(
      cat
    )
  ) {
    return [
      { id: generateId(), name: 'Color', style: 'color', values: [] },
      {
        id: generateId(),
        name: 'Material',
        style: 'button',
        values: [
          { value: 'Gold', label: 'Gold' },
          { value: 'Silver', label: 'Silver' },
          { value: 'Rose Gold', label: 'Rose Gold' }
        ]
      }
    ];
  }

  return [];
}

// ──────────────────────────────────────────
// Style constants
// ──────────────────────────────────────────

const STYLE_OPTIONS = [
  { value: 'button', label: 'Button' },
  { value: 'color', label: 'Color Swatch' },
  { value: 'text', label: 'Text Chip' }
];

const INPUT_CLASS =
  'bg-zinc-800 border border-transparent focus:border-[var(--seasonal-primary,#1a5632)] text-white text-sm rounded-xl px-4 py-2.5 w-full outline-none transition-colors placeholder:text-zinc-600';
const SELECT_CLASS =
  'bg-zinc-800 border border-transparent focus:border-[var(--seasonal-primary,#1a5632)] text-white text-sm rounded-xl px-4 py-2.5 outline-none transition-colors appearance-none cursor-pointer';
const LABEL_CLASS =
  'text-zinc-400 text-xs font-medium tracking-wider uppercase mb-1.5 block';
const BTN_PRIMARY =
  'inline-flex items-center gap-2 bg-[var(--seasonal-primary,#1a5632)] hover:brightness-110 text-white text-sm font-bold rounded-xl px-5 py-2.5 transition-all';
const BTN_SECONDARY =
  'inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl px-4 py-2.5 transition-colors';

// ──────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────

function ColorSwatch({ color, size: swatchSize = 24, className = '' }) {
  return (
    <div
      className={`inline-block rounded-full border border-zinc-700 flex-shrink-0 ${className}`}
      style={{
        width: swatchSize,
        height: swatchSize,
        backgroundColor: color || '#000000'
      }}
      title={color}
    />
  );
}

function ColorValueRow({ value, label, onChange, onRemove, pickerId }) {
  const handleSwatchClick = () => {
    const input = document.getElementById(pickerId);
    if (input) input.click();
  };

  return (
    <div className="flex items-center gap-2 group">
      <div className="relative">
        <div
          className="w-8 h-8 rounded-lg border border-zinc-700 cursor-pointer"
          style={{ backgroundColor: value || '#000000' }}
          onClick={handleSwatchClick}
        />
        <input
          id={pickerId}
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange('value', e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => onChange('label', e.target.value)}
        placeholder="Label (e.g. Red)"
        className={`${INPUT_CLASS} flex-1`}
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-zinc-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 flex-shrink-0"
        title="Remove this value"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function TextValueRow({ value, label, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2 group">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange('value', e.target.value)}
        placeholder="Value"
        className={`${INPUT_CLASS} flex-1`}
      />
      <input
        type="text"
        value={label}
        onChange={(e) => onChange('label', e.target.value)}
        placeholder="Label"
        className={`${INPUT_CLASS} flex-1`}
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-zinc-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 flex-shrink-0"
        title="Remove this value"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────
// Main component
// ──────────────────────────────────────────

export default function VariantManager({
  category,
  basePrice,
  baseSku,
  value,
  onChange,
  images = []
}) {
  // Only compute initial data on first mount
  const initialData = useMemo(
    () => convertOldToNew(value, baseSku),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [state, setState] = useState({
    types: initialData.types || [],
    items: initialData.items || []
  });
  const [showSuggestions, setShowSuggestions] = useState(
    !initialData.types || initialData.types.length === 0
  );
  const initRef = useRef(true);
  const baseSkuRef = useRef(baseSku);
  baseSkuRef.current = baseSku;

  const { types, items } = state;

  // ── Consolidated state updater ────────────
  // Always call this when you change types (may regenerate items).
  // For item-only changes (qty, sku, price, image, delete), call directly.
  const updateState = useCallback(
    (newTypes) => {
      setState((prev) => {
        const nextTypes =
          typeof newTypes === 'function' ? newTypes(prev.types) : newTypes;
        const nextItems = generateItemsFromTypes(
          nextTypes,
          prev.items,
          baseSkuRef.current
        );
        return { types: nextTypes, items: nextItems };
      });
    },
    []
  );

  // ── Notify parent after state commits ─────
  const stateRef = useRef(state);
  stateRef.current = state;

  const notifyParent = useCallback(() => {
    if (onChange) {
      onChange(stateRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange]);

  // Call notifyParent on state changes (skip initial mount)
  const prevStateRef = useRef(null);
  if (!initRef.current) {
    // Compare with previous to avoid infinite loops
    if (prevStateRef.current !== state) {
      prevStateRef.current = state;
      // Defer notification to avoid setState during render
      setTimeout(() => notifyParent(), 0);
    }
  }

  // ── Handler: update a single type field ───
  const updateTypeField = useCallback(
    (typeId, field, fieldValue) => {
      updateState((prev) =>
        prev.map((t) =>
          t.id === typeId ? { ...t, [field]: fieldValue } : t
        )
      );
    },
    [updateState]
  );

  // ── Handler: update a single value within a type ──
  const updateTypeValue = useCallback(
    (typeId, valueIndex, field, fieldValue) => {
      updateState((prev) =>
        prev.map((t) => {
          if (t.id !== typeId) return t;
          const newValues = t.values.map((v, i) =>
            i === valueIndex ? { ...v, [field]: fieldValue } : v
          );
          return { ...t, values: newValues };
        })
      );
    },
    [updateState]
  );

  // ── Handler: add a value to a type ────────
  const addTypeValue = useCallback(
    (typeId) => {
      updateState((prev) =>
        prev.map((t) => {
          if (t.id !== typeId) return t;
          if (t.style === 'color') {
            return {
              ...t,
              values: [...t.values, { value: '#ff0000', label: '' }]
            };
          }
          return {
            ...t,
            values: [...t.values, { value: '', label: '' }]
          };
        })
      );
    },
    [updateState]
  );

  // ── Handler: remove a value from a type ───
  const removeTypeValue = useCallback(
    (typeId, valueIndex) => {
      updateState((prev) =>
        prev.map((t) => {
          if (t.id !== typeId) return t;
          return {
            ...t,
            values: t.values.filter((_, i) => i !== valueIndex)
          };
        })
      );
    },
    [updateState]
  );

  // ── Handler: add a new type ───────────────
  const addType = useCallback(() => {
    updateState((prev) => [
      ...prev,
      {
        id: generateId(),
        name: '',
        style: 'button',
        values: []
      }
    ]);
    setShowSuggestions(false);
  }, [updateState]);

  // ── Handler: remove a type ────────────────
  const removeType = useCallback(
    (typeId) => {
      updateState((prev) => prev.filter((t) => t.id !== typeId));
    },
    [updateState]
  );

  // ── Handler: apply category presets ───────
  const applyPresets = useCallback(() => {
    const presets = getCategoryPresets(category);
    if (presets.length > 0) {
      updateState(presets);
      setShowSuggestions(false);
    }
  }, [category, updateState]);

  // ── Handler: update a single item field ───
  const updateItemField = useCallback(
    (itemId, field, fieldValue) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, [field]: fieldValue } : item
        )
      }));
      // Mark init as done so notification fires
      initRef.current = false;
    },
    []
  );

  // ── Handler: delete a single item ─────────
  const deleteItem = useCallback((itemId) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId)
    }));
    initRef.current = false;
  }, []);

  // ── Mark init as done after first render ──
  if (initRef.current) {
    // First render: mark init done after a microtask so we don't fire onChange
    // We just render with initial data; no notification
    setTimeout(() => {
      initRef.current = false;
    }, 0);
  }

  // ── Derived values ────────────────────────
  const hasTypesWithValues = types.some(
    (t) => t.values && t.values.length > 0
  );

  const totalStock = items.reduce(
    (sum, item) => sum + (parseInt(item.quantity, 10) || 0),
    0
  );
  const outOfStockCount = items.filter(
    (item) => !item.quantity || parseInt(item.quantity, 10) <= 0
  ).length;

  // ── Render ────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Section 1: Variant Types Definition ── */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings2 size={18} className="text-zinc-400" />
            <h3 className="text-white font-bold text-base">
              Variant Types
            </h3>
          </div>
          {types.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSuggestions((s) => !s)}
              className="text-zinc-500 hover:text-zinc-300 text-xs underline underline-offset-2 transition-colors"
            >
              {showSuggestions ? 'Hide suggestions' : 'Suggestions'}
            </button>
          )}
        </div>

        {/* Empty state / Suggestions */}
        {types.length === 0 && (
          <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-zinc-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-zinc-300 text-sm font-medium mb-1">
                  Adding variants helps customers pick exactly what they need.
                </p>
                <p className="text-zinc-500 text-xs">
                  Define variant types to get started. You can add up to 3
                  different types like Size, Color, Storage, or Material.
                </p>
              </div>
            </div>

            {/* Category-based presets */}
            {category && (
              <div className="border-t border-zinc-700/40 pt-3">
                <p className="text-zinc-500 text-xs font-medium mb-2.5 uppercase tracking-wider">
                  Suggested for{' '}
                  <span className="text-zinc-300 normal-case">
                    {category}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {getCategoryPresets(category).length > 0 ? (
                    <button
                      type="button"
                      onClick={applyPresets}
                      className={BTN_PRIMARY}
                    >
                      <Plus size={15} />
                      Apply Suggestions
                    </button>
                  ) : (
                    <p className="text-zinc-600 text-xs italic">
                      No presets available. Add types manually.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Manual add button in empty state */}
            {!category && (
              <div className="border-t border-zinc-700/40 pt-3">
                <button
                  type="button"
                  onClick={addType}
                  className={BTN_PRIMARY}
                >
                  <Plus size={15} />
                  Add First Variant Type
                </button>
              </div>
            )}
          </div>
        )}

        {/* Type list */}
        {types.length > 0 && (
          <div className="space-y-4">
            {types.map((type, typeIndex) => (
              <div
                key={type.id}
                className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-5 space-y-4"
              >
                {/* Type header row */}
                <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                  {/* Type name */}
                  <div className="flex-1 min-w-[140px]">
                    <label className={LABEL_CLASS}>Type Name</label>
                    <input
                      type="text"
                      value={type.name}
                      onChange={(e) =>
                        updateTypeField(type.id, 'name', e.target.value)
                      }
                      placeholder={
                        typeIndex === 0
                          ? 'e.g. Color'
                          : typeIndex === 1
                          ? 'e.g. Size'
                          : 'e.g. Material'
                      }
                      className={INPUT_CLASS}
                    />
                  </div>

                  {/* Style select */}
                  <div className="w-full sm:w-36">
                    <label className={LABEL_CLASS}>Style</label>
                    <div className="relative">
                      <select
                        value={type.style}
                        onChange={(e) =>
                          updateTypeField(type.id, 'style', e.target.value)
                        }
                        className={`${SELECT_CLASS} w-full pr-8`}
                      >
                        {STYLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <ChevronDown size={14} className="text-zinc-500" />
                      </div>
                    </div>
                  </div>

                  {/* Remove type */}
                  <button
                    type="button"
                    onClick={() => removeType(type.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors p-2 mt-5 flex-shrink-0"
                    title="Remove this type"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Values list */}
                {type.values && type.values.length > 0 && (
                  <div className="space-y-2 pl-1">
                    {type.values.map((val, vi) => {
                      if (type.style === 'color') {
                        return (
                          <ColorValueRow
                            key={vi}
                            value={val.value}
                            label={val.label}
                            pickerId={`color-picker-${type.id}-${vi}`}
                            onChange={(field, fv) =>
                              updateTypeValue(type.id, vi, field, fv)
                            }
                            onRemove={() => removeTypeValue(type.id, vi)}
                          />
                        );
                      }
                      return (
                        <TextValueRow
                          key={vi}
                          value={val.value}
                          label={val.label}
                          onChange={(field, fv) =>
                            updateTypeValue(type.id, vi, field, fv)
                          }
                          onRemove={() => removeTypeValue(type.id, vi)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* No values placeholder */}
                {(!type.values || type.values.length === 0) && (
                  <p className="text-zinc-600 text-xs italic pl-1">
                    No values added yet. Click below to add one.
                  </p>
                )}

                {/* Add value button */}
                <button
                  type="button"
                  onClick={() => addTypeValue(type.id)}
                  className={`${BTN_SECONDARY} text-xs !py-2 !px-3`}
                >
                  <Plus size={13} />
                  Add{' '}
                  {type.style === 'color'
                    ? 'Color'
                    : type.style === 'button'
                    ? 'Option'
                    : 'Value'}
                </button>
              </div>
            ))}

            {/* Add type button */}
            {types.length < 3 && (
              <button
                type="button"
                onClick={addType}
                className={`${BTN_SECONDARY} w-full justify-center`}
              >
                <Plus size={16} />
                Add Variant Type
              </button>
            )}

            {types.length >= 3 && (
              <p className="text-zinc-600 text-xs text-center">
                Maximum of 3 variant types reached.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Section 2: Generated Matrix ────────── */}
      {hasTypesWithValues && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Tag size={18} className="text-zinc-400" />
              <h3 className="text-white font-bold text-base">
                Variant Matrix
              </h3>
              <span className="text-zinc-600 text-xs bg-zinc-800/60 rounded-lg px-2.5 py-1">
                {items.length} variant{items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Stock summary */}
            {items.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-zinc-500">
                  Total Stock:{' '}
                  <strong className="text-zinc-200">{totalStock}</strong>
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    outOfStockCount > 0 ? 'text-amber-400' : 'text-zinc-500'
                  }`}
                >
                  {outOfStockCount > 0 && <AlertTriangle size={12} />}
                  Out of Stock:{' '}
                  <strong
                    className={
                      outOfStockCount > 0
                        ? 'text-amber-300'
                        : 'text-zinc-200'
                    }
                  >
                    {outOfStockCount}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {items.length > 0 ? (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-500 text-xs font-medium uppercase tracking-wider py-3 px-3 min-w-[160px]">
                      Combination
                    </th>
                    <th className="text-left text-zinc-500 text-xs font-medium uppercase tracking-wider py-3 px-3 min-w-[80px]">
                      Qty
                    </th>
                    <th className="text-left text-zinc-500 text-xs font-medium uppercase tracking-wider py-3 px-3 min-w-[130px]">
                      Price Adj.
                    </th>
                    <th className="text-left text-zinc-500 text-xs font-medium uppercase tracking-wider py-3 px-3 min-w-[140px]">
                      SKU
                    </th>
                    <th className="text-left text-zinc-500 text-xs font-medium uppercase tracking-wider py-3 px-3 min-w-[130px]">
                      Image
                    </th>
                    <th className="w-10 py-3 px-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {items.map((item) => {
                    // Find color-type value in this item for the swatch
                    const colorType = types.find(
                      (t) =>
                        t.style === 'color' &&
                        item.attrs[t.id] !== undefined
                    );
                    const colorValue = colorType
                      ? item.attrs[colorType.id]
                      : null;
                    const comboLabel = getCombinationLabel(item.attrs, types);
                    const numericBase = parseFloat(basePrice) || 0;
                    const numericAdj = parseFloat(item.priceAdjustment) || 0;
                    const adjustedPrice = numericBase + numericAdj;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-800/20 transition-colors group"
                      >
                        {/* Combination preview */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {colorValue && (
                              <ColorSwatch color={colorValue} size={20} />
                            )}
                            <span className="text-white text-sm font-medium">
                              {comboLabel || (
                                <span className="text-zinc-500 italic">
                                  No label
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity ?? 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              updateItemField(
                                item.id,
                                'quantity',
                                isNaN(val) ? 0 : Math.max(0, val)
                              );
                            }}
                            className={`${INPUT_CLASS} w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          />
                        </td>

                        {/* Price adjustment */}
                        <td className="py-3 px-3">
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-600 text-xs whitespace-nowrap">
                                {numericBase > 0 &&
                                  formatCurrency(numericBase)}
                              </span>
                              <div className="relative flex-1 min-w-[80px]">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">
                                  {numericAdj >= 0 ? '+' : ''}
                                </span>
                                <input
                                  type="number"
                                  value={numericAdj}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    updateItemField(
                                      item.id,
                                      'priceAdjustment',
                                      isNaN(val) ? 0 : val
                                    );
                                  }}
                                  className={`${INPUT_CLASS} w-full pl-6 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                />
                              </div>
                            </div>
                            {numericBase > 0 && (
                              <p className="text-zinc-600 text-[10px] mt-0.5 text-right">
                                = {formatCurrency(adjustedPrice)}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={item.sku}
                            onChange={(e) =>
                              updateItemField(item.id, 'sku', e.target.value)
                            }
                            className={`${INPUT_CLASS} font-mono text-xs`}
                            placeholder="SKU"
                          />
                        </td>

                        {/* Image selector */}
                        <td className="py-3 px-3">
                          {images.length > 0 ? (
                            <div className="relative">
                              <select
                                value={item.imageUrl || ''}
                                onChange={(e) =>
                                  updateItemField(
                                    item.id,
                                    'imageUrl',
                                    e.target.value
                                  )
                                }
                                className={`${SELECT_CLASS} w-full text-xs pr-8`}
                              >
                                <option value="">No image</option>
                                {images.map((img, i) => (
                                  <option key={i} value={img}>
                                    Image {i + 1}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                <ChevronDown
                                  size={12}
                                  className="text-zinc-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-600 text-xs italic">
                              No images
                            </span>
                          )}
                        </td>

                        {/* Delete */}
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                            title="Delete this variant"
                          >
                            <X size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty matrix (types exist but no items generated) */
            <div className="bg-zinc-800/20 border border-zinc-700/30 rounded-2xl p-8 text-center">
              <Hash size={28} className="text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">
                Add values to your variant types to generate the matrix.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Currency formatting
// ──────────────────────────────────────────

function formatCurrency(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}
