import { useState, useMemo } from 'react';
import { Palette, Plus, X, Trash2, Shirt, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { COLOR_PALETTE, SIZE_PRESETS, getPresetSizes, generateSKU } from '../utils/constants';

/**
 * VariantManager — allows admin to create size/color variants for a product.
 * Each variant has: id, size, color, colorName, sku, quantity, priceAdjustment, imageUrl
 */
export default function VariantManager({ category, basePrice, baseSku, value = [], onChange, images = [] }) {
  const [expanded, setExpanded] = useState(value.length > 0);
  const [colors, setColors] = useState(() => {
    // Extract unique colors from existing variants
    const c = new Map();
    value.forEach(v => {
      if (v.color && !c.has(v.color)) c.set(v.color, v.colorName || v.color);
    });
    return Array.from(c.entries()).map(([hex, name]) => ({ hex, name }));
  });
  const [sizes, setSizes] = useState(() => {
    // Extract unique sizes from existing variants
    const s = new Set();
    value.forEach(v => { if (v.size) s.add(v.size); });
    return Array.from(s);
  });
  const [variants, setVariants] = useState(() => {
    if (value.length > 0) return value;
    return [];
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#000000');
  const [customSize, setCustomSize] = useState('');

  const presetSizes = useMemo(() => getPresetSizes(category), [category]);
  const isClothing = presetSizes || category === 'Clothing' || category === 'T-Shirts' || category.toLowerCase().includes('shoe') || category.toLowerCase().includes('cloth');

  // Sync variants to parent
  const updateVariants = (newVariants) => {
    setVariants(newVariants);
    onChange(newVariants);
  };

  // Generate all combinations of selected colors × sizes
  const generateMatrix = () => {
    if (colors.length === 0 || sizes.length === 0) return;
    const newVariants = [];
    sizes.forEach(size => {
      colors.forEach(color => {
        // Check if variant already exists
        const existing = variants.find(v => v.size === size && v.color === color.hex);
        if (existing) {
          newVariants.push(existing);
        } else {
          newVariants.push({
            id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            size,
            color: color.hex,
            colorName: color.name,
            sku: baseSku ? `${baseSku}-${size}-${color.name.replace(/\s/g, '').toUpperCase()}` : generateSKU(category),
            quantity: 0,
            priceAdjustment: 0,
            imageUrl: '',
          });
        }
      });
    });
    updateVariants(newVariants);
  };

  const addColorFromPalette = (paletteColor) => {
    if (!colors.find(c => c.hex === paletteColor.hex)) {
      setColors(prev => [...prev, paletteColor]);
    }
    setShowColorPicker(false);
  };

  const addCustomColor = () => {
    if (customColorName.trim() && customColorHex) {
      if (!colors.find(c => c.hex === customColorHex)) {
        setColors(prev => [...prev, { hex: customColorHex, name: customColorName.trim() }]);
      }
      setCustomColorName('');
      setCustomColorHex('#000000');
    }
  };

  const removeColor = (hex) => {
    setColors(prev => prev.filter(c => c.hex !== hex));
    // Remove variants using this color
    updateVariants(variants.filter(v => v.color !== hex));
  };

  const addSize = (size) => {
    if (size && !sizes.includes(size)) {
      setSizes(prev => [...prev, size].sort((a, b) => {
        // Try numeric sort first
        const an = parseFloat(a), bn = parseFloat(b);
        if (!isNaN(an) && !isNaN(bn)) return an - bn;
        // Use preset order if available
        if (presetSizes) {
          const ai = presetSizes.indexOf(a), bi = presetSizes.indexOf(b);
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1;
          if (bi !== -1) return 1;
        }
        return a.localeCompare(b);
      }));
    }
    setCustomSize('');
  };

  const removeSize = (size) => {
    setSizes(prev => prev.filter(s => s !== size));
    // Remove variants using this size
    updateVariants(variants.filter(v => v.size !== size));
  };

  const updateVariant = (id, field, val) => {
    updateVariants(variants.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  const removeVariant = (id) => {
    updateVariants(variants.filter(v => v.id !== id));
  };

  const bulkSetQuantity = (qty) => {
    updateVariants(variants.map(v => ({ ...v, quantity: parseInt(qty) || 0 })));
  };

  const setAllPriceAdjustment = (adj) => {
    updateVariants(variants.map(v => ({ ...v, priceAdjustment: parseFloat(adj) || 0 })));
  };

  const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Shirt className="w-4 h-4 text-[var(--seasonal-primary,#1a5632)]" />
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Product Variants</span>
          {variants.length > 0 && (
            <span className="text-[10px] font-bold bg-[var(--seasonal-primary,#1a5632)] text-white px-1.5 py-0.5 rounded-full">
              {variants.length} variants
            </span>
          )}
          {totalStock > 0 && (
            <span className="text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
              {totalStock} total stock
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-5">
          {/* Universal info about variants */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Add size options so customers can pick the right variant (e.g. S/M/L/XL, 30ml/50ml/100ml, Small/Medium/Large). Click preset sizes below or type custom ones.
            </p>
          </div>

          {/* Step 1: Select Colors */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Colors</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {colors.map(color => (
                <div key={color.hex} className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-1 pr-2 py-1">
                  <div className="w-5 h-5 rounded border border-zinc-300 dark:border-zinc-600 flex-shrink-0" style={{ backgroundColor: color.hex }} />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{color.name}</span>
                  <button type="button" onClick={() => removeColor(color.hex)} className="text-zinc-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-1 px-2 py-1 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-xs text-zinc-500 hover:text-[var(--seasonal-primary,#1a5632)] hover:border-[var(--seasonal-primary,#1a5632)] transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Color
              </button>
            </div>

            {/* Color Picker */}
            {showColorPicker && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Preset Colors</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => addColorFromPalette(c)}
                      className="group relative w-7 h-7 rounded-lg border-2 border-zinc-200 dark:border-zinc-600 hover:border-[var(--seasonal-primary,#1a5632)] transition-colors hover:scale-110"
                      style={{ backgroundColor: c.hex.includes('linear') ? undefined : c.hex, background: c.hex.includes('linear') ? c.hex : undefined }}
                      title={c.name}
                    >
                      {colors.find(ec => ec.hex === c.hex) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/40 rounded-md">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <input type="color" value={customColorHex} onChange={e => setCustomColorHex(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <input type="text" value={customColorName} onChange={e => setCustomColorName(e.target.value)} placeholder="Color name (e.g. Sky Blue)" className="flex-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white" />
                  <button type="button" onClick={addCustomColor} disabled={!customColorName.trim()} className="px-3 py-1 bg-[var(--seasonal-primary,#1a5632)] text-white text-xs font-bold rounded-lg disabled:opacity-50">Add</button>
                  <button type="button" onClick={() => setShowColorPicker(false)} className="text-xs text-zinc-500 hover:text-zinc-700">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Select Sizes */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Sizes</label>
            {presetSizes && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {presetSizes.map(size => {
                  const active = sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => active ? removeSize(size) : addSize(size)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        active
                          ? 'bg-[var(--seasonal-primary,#1a5632)] text-white border-[var(--seasonal-primary,#1a5632)]'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-[var(--seasonal-primary,#1a5632)]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSize}
                onChange={e => setCustomSize(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize(customSize); } }}
                placeholder={presetSizes ? "Or type custom size..." : "Type a size and press Enter"}
                className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white w-36"
              />
              <button type="button" onClick={() => addSize(customSize)} disabled={!customSize.trim()} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-lg disabled:opacity-50">Add</button>
            </div>
          </div>

          {/* Step 3: Generate Matrix */}
          {colors.length > 0 && sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Variant Matrix</label>
                <button
                  type="button"
                  onClick={generateMatrix}
                  className="text-xs text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline"
                >
                  {variants.length > 0 ? 'Regenerate Matrix' : 'Generate All Combinations'}
                </button>
              </div>

              {variants.length > 0 && (
                <>
                  {/* Bulk actions */}
                  <div className="flex items-center gap-3 mb-3 p-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Bulk:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500">Qty:</span>
                      <input type="number" min="0" placeholder="0" className="w-14 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); bulkSetQuantity(e.target.value); } }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500">Price ±:</span>
                      <input type="number" step="50" placeholder="0" className="w-16 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setAllPriceAdjustment(e.target.value); } }} />
                    </div>
                  </div>

                  {/* Variant table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-700">
                          <th className="text-left py-1.5 px-2 text-zinc-500 font-bold">Size</th>
                          <th className="text-left py-1.5 px-2 text-zinc-500 font-bold">Color</th>
                          <th className="text-left py-1.5 px-2 text-zinc-500 font-bold w-16">Stock</th>
                          <th className="text-left py-1.5 px-2 text-zinc-500 font-bold w-20">Price ±</th>
                          <th className="text-left py-1.5 px-2 text-zinc-500 font-bold w-28">SKU</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map(v => (
                          <tr key={v.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                            <td className="py-1.5 px-2 font-bold text-zinc-900 dark:text-white">{v.size}</td>
                            <td className="py-1.5 px-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded border border-zinc-200 dark:border-zinc-600 flex-shrink-0" style={{ backgroundColor: v.color?.startsWith('#') ? v.color : '#ccc' }} />
                                <span className="text-zinc-600 dark:text-zinc-400">{v.colorName}</span>
                              </div>
                            </td>
                            <td className="py-1.5 px-2">
                              <input type="number" min="0" value={v.quantity || 0} onChange={e => updateVariant(v.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-14 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-center" />
                            </td>
                            <td className="py-1.5 px-2">
                              <input type="number" step="50" value={v.priceAdjustment || 0} onChange={e => updateVariant(v.id, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" placeholder="0" />
                            </td>
                            <td className="py-1.5 px-2">
                              <input type="text" value={v.sku || ''} onChange={e => updateVariant(v.id, 'sku', e.target.value)}
                                className="w-full px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-[10px]" />
                            </td>
                            <td className="py-1.5 px-1">
                              <button type="button" onClick={() => removeVariant(v.id)} className="text-zinc-400 hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2">
                    Final price = base price + price adjustment. Leave adjustment at 0 for base price ({formatKES(parseInt(basePrice) || 0)}).
                  </p>
                </>
              )}
            </div>
          )}

          {colors.length === 0 && sizes.length === 0 && (
            <div className="text-center py-6 text-zinc-400">
              <Palette className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Select colors and sizes above to generate variants</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

