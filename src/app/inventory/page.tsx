"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from '@iconify/react';
import {
  Package,
  Plus,
  Minus,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingGuard } from "@/components/onboarding-guard";
import {
  getOnboardingData,
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
  deleteInventoryItem,
} from "@/lib/storage";
import {
  BUSINESS_TYPES,
  INVENTORY_CATEGORY_PRESETS,
  INVENTORY_STARTER_ITEMS,
  type BusinessType,
  type InventoryItem,
} from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

// Shape of the inline add/edit form. Numbers are kept as strings so the inputs
// can be cleared while typing; they're coerced on save.
interface FormState {
  name: string;
  category: string;
  unit: string;
  quantity: string;
  lowStockThreshold: string;
  costPrice: string;
  sellingPrice: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  category: "",
  unit: "",
  quantity: "",
  lowStockThreshold: "",
  costPrice: "",
  sellingPrice: "",
};

function isLowStock(item: InventoryItem): boolean {
  return item.quantity <= item.lowStockThreshold;
}

export default function InventoryPage() {
  const [businessType, setBusinessType] = useState<BusinessType>("other");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = INVENTORY_CATEGORY_PRESETS[businessType];
  const businessLabel =
    BUSINESS_TYPES.find((b) => b.value === businessType)?.label ?? "business";

  useEffect(() => {
    async function load() {
      const data = await getOnboardingData();
      if (data) setBusinessType(data.businessType);
      setItems(await getInventory());
      setLoading(false);
    }
    load();
  }, []);

  async function refresh() {
    setItems(await getInventory());
  }

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((i) => (i.category ?? "") === activeCategory);
  }, [items, activeCategory]);

  const summary = useMemo(() => {
    const lowStock = items.filter(isLowStock).length;
    const stockValue = items.reduce(
      (sum, i) => sum + i.quantity * (i.sellingPrice ?? 0),
      0
    );
    return { totalItems: items.length, lowStock, stockValue };
  }, [items]);

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category ?? "",
      unit: item.unit ?? "",
      quantity: String(item.quantity),
      lowStockThreshold: String(item.lowStockThreshold),
      costPrice: item.costPrice != null ? String(item.costPrice) : "",
      sellingPrice: item.sellingPrice != null ? String(item.sellingPrice) : "",
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setFormError("Item name is required");
      return;
    }
    const quantity = Number(form.quantity) || 0;
    const lowStockThreshold = Number(form.lowStockThreshold) || 0;
    const costPrice = form.costPrice.trim() ? Number(form.costPrice) : undefined;
    const sellingPrice = form.sellingPrice.trim()
      ? Number(form.sellingPrice)
      : undefined;

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        unit: form.unit.trim() || undefined,
        quantity,
        lowStockThreshold,
        costPrice,
        sellingPrice,
      };
      if (editingId) {
        await updateInventoryItem(editingId, payload);
      } else {
        await addInventoryItem(payload);
      }
      await refresh();
      closeForm();
    } finally {
      setBusy(false);
    }
  }

  async function handleAdjust(id: string, delta: number) {
    setBusy(true);
    try {
      await adjustInventoryStock(id, delta);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await deleteInventoryItem(id);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function seedStarterItems() {
    setBusy(true);
    try {
      for (const starter of INVENTORY_STARTER_ITEMS[businessType]) {
        await addInventoryItem(starter);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingGuard>
      <div className="mx-auto max-w-lg px-4 py-6 md:max-w-2xl md:px-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-extrabold text-gray-900">Inventory</h1>
            </div>
            <p className="text-muted-foreground">
              Track stock for your {businessLabel.toLowerCase()} business
            </p>
          </div>
          {!showForm && (
            <Button onClick={openAddForm} className="shrink-0">
              <Plus className="h-4 w-4" /> Add item
            </Button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-2 border-green-100">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="text-xl font-extrabold text-gray-900">{summary.totalItems}</p>
            </CardContent>
          </Card>
          <Card className={cn("border-2", summary.lowStock > 0 ? "border-red-200 bg-red-50" : "border-green-100")}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Low stock</p>
              <p className={cn("text-xl font-extrabold", summary.lowStock > 0 ? "text-red-600" : "text-gray-900")}>
                {summary.lowStock}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-100">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Stock value</p>
              <p className="text-xl font-extrabold text-primary">{formatCurrency(summary.stockValue)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Add / edit form */}
        {showForm && (
          <Card className="mb-6 border-2 border-primary/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">
                  {editingId ? "Edit item" : "New item"}
                </h2>
                <Button variant="ghost" size="icon" onClick={closeForm} aria-label="Close form">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{formError}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="inv-name">Item name</Label>
                <Input
                  id="inv-name"
                  placeholder="e.g. Rice"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="inv-category">Category</Label>
                  <Input
                    id="inv-category"
                    list="inv-category-options"
                    placeholder="e.g. Groceries"
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                  />
                  <datalist id="inv-category-options">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-unit">Unit</Label>
                  <Input
                    id="inv-unit"
                    placeholder="e.g. bag, bottle"
                    value={form.unit}
                    onChange={(e) => updateField("unit", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="inv-qty">Stock quantity</Label>
                  <Input
                    id="inv-qty"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => updateField("quantity", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-threshold">Low-stock alert at</Label>
                  <Input
                    id="inv-threshold"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={form.lowStockThreshold}
                    onChange={(e) => updateField("lowStockThreshold", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="inv-cost">Cost price (₦)</Label>
                  <Input
                    id="inv-cost"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={form.costPrice}
                    onChange={(e) => updateField("costPrice", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-price">Selling price (₦)</Label>
                  <Input
                    id="inv-price"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={form.sellingPrice}
                    onChange={(e) => updateField("sellingPrice", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={handleSubmit} disabled={busy} className="flex-1">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingId ? "Save changes" : "Add item"}
                </Button>
                <Button variant="outline" onClick={closeForm} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category filter */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition-all border-2",
                  activeCategory === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-green-100 bg-green-50 text-green-800 hover:border-primary/30"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <Card className="border-2 border-green-100">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your inventory...
            </CardContent>
          </Card>
        )}

        {/* Item list */}
        {!loading && (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const low = isLowStock(item);
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "border-2",
                    low ? "border-red-200 bg-red-50/50" : "border-green-100"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 truncate">{item.name}</p>
                          {item.category && (
                            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">
                              {item.category}
                            </span>
                          )}
                          {low && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">
                              <AlertTriangle className="h-3 w-3" /> Low
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.sellingPrice != null && (
                            <>Sells at {formatCurrency(item.sellingPrice)}</>
                          )}
                          {item.sellingPrice != null && item.costPrice != null && " · "}
                          {item.costPrice != null && (
                            <>Cost {formatCurrency(item.costPrice)}</>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(item)}
                          disabled={busy}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          disabled={busy}
                          aria-label={`Delete ${item.name}`}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <span className={cn("text-2xl font-extrabold", low ? "text-red-600" : "text-gray-900")}>
                          {item.quantity}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                          {item.unit ? `${item.unit}${item.quantity === 1 ? "" : "s"} in stock` : "in stock"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleAdjust(item.id, -1)}
                          disabled={busy || item.quantity === 0}
                          aria-label={`Reduce ${item.name} stock`}
                        >
                          <Icon icon="akar-icons:minus" className="h-6 w-6"  />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleAdjust(item.id, 1)}
                          disabled={busy}
                          aria-label={`Increase ${item.name} stock`}
                        >
                          
                          <Icon icon="akar-icons:plus" className="h-6 w-6"  />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Empty state — no items at all */}
            {items.length === 0 && (
              <Card className="border-2 border-dashed border-green-200">
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 mb-1">No items yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your stock to track quantities and get low-stock alerts.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={openAddForm}>
                      <Plus className="h-4 w-4" /> Add an item
                    </Button>
                    <Button variant="outline" onClick={seedStarterItems} disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Add starter items for {businessLabel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state — items exist but none in the active category */}
            {items.length > 0 && filteredItems.length === 0 && (
              <Card className="border-2 border-dashed border-green-200">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No items in {activeCategory}.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </OnboardingGuard>
  );
}
