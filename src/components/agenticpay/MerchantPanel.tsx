import React, { useState } from "react";
import {
  Headphones,
  Keyboard,
  Monitor,
  Mouse,
  Package,
  Plus,
  Minus,
  ShieldCheck,
  Square,
  Store,
  Usb,
  PlusCircle,
  X,
} from "lucide-react";
import { PanelHead } from "./AgentPanel";
import { inr } from "@/lib/agenticpay/format";
import type { CatalogItem, Category, Guardrails } from "@/lib/agenticpay/types";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  keyboard: Keyboard,
  mouse: Mouse,
  monitor: Monitor,
  usb: Usb,
  headphones: Headphones,
  package: Package,
  square: Square,
};

export function MerchantPanel({
  catalog,
  guardrails,
  setGuardrails,
  onAddProduct,
  onUpdateStock,
}: {
  catalog: CatalogItem[];
  guardrails: Guardrails;
  setGuardrails: React.Dispatch<React.SetStateAction<Guardrails>>;
  onAddProduct?: (item: CatalogItem) => void;
  onUpdateStock?: (id: string, newStock: number) => void;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Electronics");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;
    const item: CatalogItem = {
      id: `sku_custom_${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      price: Number(newPrice),
      stock: Number(newStock) || 10,
      category: newCategory,
      icon: newCategory === "Electronics" ? "keyboard" : newCategory === "Accessories" ? "mouse" : "package",
      tags: ["merchant-added", newCategory.toLowerCase()],
    };
    onAddProduct?.(item);
    setNewName("");
    setNewPrice("");
    setNewStock("");
    setShowAddModal(false);
  };

  const filteredCatalog =
    filterCategory === "All" ? catalog : catalog.filter((i) => i.category === filterCategory);

  return (
    <section className="flex flex-col gap-4">
      <PanelHead
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Merchant & Guardrail Console"
        sub="Catalog + bounded financial policy"
      />

      <div className="panel-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Store className="h-4 w-4 text-indigo-400" />
            <span>Merchant Catalog</span>
            <span className="rounded-full bg-surface/80 px-2 py-0.5 text-[11px] text-muted-foreground border border-border">
              {catalog.length} SKUs
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {showAddModal ? <X className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
            {showAddModal ? "Cancel" : "Add Product"}
          </button>
        </div>

        {/* Add Product Inline Form */}
        {showAddModal && (
          <form onSubmit={handleAddSubmit} className="mt-3 rounded-lg border border-primary/30 bg-surface/90 p-3 space-y-2.5">
            <p className="text-xs font-semibold text-primary">Add Custom Merchant SKU</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Product Name (e.g. Sony ANC Headphones)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <input
                type="number"
                placeholder="Price in INR (e.g. 2999)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="number"
                placeholder="Initial Stock (e.g. 15)"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Category)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Software">Software</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Publish SKU to Live Catalog
            </button>
          </form>
        )}

        {/* Filter Pills */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {["All", "Electronics", "Accessories", "Software"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] transition-colors ${
                filterCategory === cat
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-surface border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards List with Live Stock Counters */}
        <div className="mt-3 grid max-h-[300px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {filteredCatalog.map((i) => {
            const Icon = icons[i.icon] ?? Package;
            return (
              <div key={i.id} className="rounded-lg border border-border bg-surface/50 p-3 hover:border-border/80 transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-500/15 text-indigo-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" title={i.name}>{i.name}</p>
                    <p className="text-xs font-semibold text-primary">{inr(i.price)}</p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-border/40 pt-2 text-[11px]">
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    i.stock > 0 ? "bg-primary/10 text-primary" : "bg-destructive/15 text-destructive"
                  }`}>
                    {i.stock > 0 ? `${i.stock} in stock` : "Out of stock"}
                  </span>

                  {/* Stock Modifier Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateStock?.(i.id, Math.max(0, i.stock - 1))}
                      className="grid h-5 w-5 place-items-center rounded border border-border bg-surface hover:bg-surface/80 text-muted-foreground hover:text-foreground"
                      title="Decrease Stock"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-mono text-[10px]">{i.stock}</span>
                    <button
                      onClick={() => onUpdateStock?.(i.id, i.stock + 1)}
                      className="grid h-5 w-5 place-items-center rounded border border-border bg-surface hover:bg-surface/80 text-muted-foreground hover:text-foreground"
                      title="Increase Stock"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guardrails Configuration */}
      <div className="panel-card space-y-5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Bounded Financial Guardrails
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Max Per-Order Cap</span>
            <span className="font-semibold text-primary">{inr(guardrails.maxPerOrder)}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={20000}
            step={500}
            value={guardrails.maxPerOrder}
            onChange={(e) =>
              setGuardrails((g) => ({ ...g, maxPerOrder: Number(e.target.value) }))
            }
            style={{ accentColor: "var(--emerald)" }}
            className="mt-2 w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>₹1,000</span>
            <span>₹20,000</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Allowed Category Whitelist</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(guardrails.categories) as Category[]).map((c) => {
              const on = guardrails.categories[c];
              return (
                <button
                  key={c}
                  onClick={() =>
                    setGuardrails((g) => ({
                      ...g,
                      categories: { ...g.categories, [c]: !g.categories[c] },
                    }))
                  }
                  className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                    on
                      ? "border-primary/50 bg-primary/10 text-primary font-medium"
                      : "border-border bg-surface/60 text-muted-foreground"
                  }`}
                >
                  {on ? "✓ " : "✕ "}
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Price Drift Tolerance</span>
            <span className="font-semibold text-violet-400">{guardrails.priceDrift}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={guardrails.priceDrift}
            onChange={(e) => setGuardrails((g) => ({ ...g, priceDrift: Number(e.target.value) }))}
            style={{ accentColor: "var(--violet)" }}
            className="mt-2 w-full"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/50 p-3">
          <div className="min-w-0">
            <p className="text-xs font-medium">
              {guardrails.autoApprove ? "Auto-Approval" : "Human-in-the-Loop"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {guardrails.autoApprove
                ? "Out-of-bounds orders are hard-blocked"
                : "Out-of-bounds orders need merchant confirmation"}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={!guardrails.autoApprove}
            onClick={() => setGuardrails((g) => ({ ...g, autoApprove: !g.autoApprove }))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              guardrails.autoApprove ? "bg-border" : "bg-primary"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-all ${
                guardrails.autoApprove ? "left-0.5" : "left-[22px]"
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
