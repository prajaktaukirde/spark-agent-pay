"""
Merchant Catalog Database & Helpers for Spark-Agent-Pay
Provides real-time inventory, stock tracking, and metadata for AI Buyer Agents.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class CatalogItem(BaseModel):
    id: str
    name: str
    price: int  # in INR (Rupees)
    stock: int
    category: str  # "Electronics" | "Accessories" | "Software"
    icon: str = "package"
    tags: List[str] = Field(default_factory=list)
    description: Optional[str] = None

# Default Dynamic Merchant Catalog
MERCHANT_CATALOG: Dict[str, CatalogItem] = {
    "sku_kb_01": CatalogItem(
        id="sku_kb_01",
        name="Aurora TKL Mechanical Keyboard",
        price=2499,
        stock=12,
        category="Electronics",
        icon="keyboard",
        tags=["hot-swap", "wireless", "rgb", "fast-delivery", "keyboard"],
        description="Compact 87-key wireless mechanical keyboard with hot-swappable switches and RGB backlighting."
    ),
    "sku_ms_01": CatalogItem(
        id="sku_ms_01",
        name="Vector Ergonomic Mouse",
        price=1299,
        stock=8,
        category="Accessories",
        icon="mouse",
        tags=["ergonomic", "silent", "wireless", "mouse"],
        description="Ergonomic vertical wireless mouse designed for wrist strain relief with silent switches."
    ),
    "sku_ms_02": CatalogItem(
        id="sku_ms_02",
        name="Vector Lite Mouse (Substitute)",
        price=999,
        stock=34,
        category="Accessories",
        icon="mouse",
        tags=["budget", "in-stock", "fast-delivery", "mouse"],
        description="Lightweight 6-button wireless mouse with 3200 DPI optical sensor."
    ),
    "sku_pad_01": CatalogItem(
        id="sku_pad_01",
        name="Desk Mat XL — Charcoal",
        price=699,
        stock=40,
        category="Accessories",
        icon="square",
        tags=["fast-delivery", "microfiber", "desk-mat"],
        description="900x400mm water-resistant microfiber desk pad with anti-fray stitched edges."
    ),
    "sku_mon_01": CatalogItem(
        id="sku_mon_01",
        name='Lumen 27" 4K Monitor',
        price=18999,
        stock=3,
        category="Electronics",
        icon="monitor",
        tags=["4k", "premium", "hdr", "ips", "screen", "monitor"],
        description="27-inch 4K UHD IPS display with 99% sRGB color gamut, USB-C 65W power delivery."
    ),
    "sku_hub_01": CatalogItem(
        id="sku_hub_01",
        name="PortMax 7-in-1 USB-C Hub",
        price=1899,
        stock=21,
        category="Electronics",
        icon="usb",
        tags=["fast-delivery", "4k-hdmi", "pd100w", "adapter", "hub"],
        description="Aluminium 7-in-1 USB-C hub with 4K HDMI, 100W PD pass-through, SD card reader, 3x USB 3.0."
    ),
    "sku_sw_01": CatalogItem(
        id="sku_sw_01",
        name="FocusOS Pro — 1yr License",
        price=1499,
        stock=999,
        category="Software",
        icon="package",
        tags=["instant", "license", "ai-productivity", "software"],
        description="1-year single-user enterprise productivity and automated workflow software license."
    ),
    "sku_hs_01": CatalogItem(
        id="sku_hs_01",
        name="Nimbus ANC Headset",
        price=3299,
        stock=0,
        category="Electronics",
        icon="headphones",
        tags=["anc", "out-of-stock", "bluetooth-5.3", "headphone", "audio"],
        description="Active Noise Cancelling over-ear Bluetooth 5.3 headset with 40-hour battery life."
    )
}

def get_all_catalog_items() -> List[CatalogItem]:
    """Return all catalog items."""
    return list(MERCHANT_CATALOG.values())

def get_item_by_id(item_id: str) -> Optional[CatalogItem]:
    """Lookup an item by SKU ID."""
    return MERCHANT_CATALOG.get(item_id)

def add_or_update_item(item: CatalogItem) -> CatalogItem:
    """Adds a new item or updates an existing item in the catalog."""
    MERCHANT_CATALOG[item.id] = item
    return item

def update_item_stock(item_id: str, stock: int) -> Optional[CatalogItem]:
    """Updates inventory count for an item."""
    if item_id in MERCHANT_CATALOG:
        MERCHANT_CATALOG[item_id].stock = stock
        return MERCHANT_CATALOG[item_id]
    return None

def decrement_inventory(item_id: str, qty: int = 1) -> Optional[CatalogItem]:
    """Decrements stock after successful payment."""
    if item_id in MERCHANT_CATALOG:
        current = MERCHANT_CATALOG[item_id].stock
        MERCHANT_CATALOG[item_id].stock = max(0, current - qty)
        return MERCHANT_CATALOG[item_id]
    return None

def search_catalog(
    category_whitelist: Optional[List[str]] = None,
    max_price: Optional[int] = None,
    in_stock_only: bool = True,
    query: Optional[str] = None
) -> List[CatalogItem]:
    """Search and filter catalog based on buyer preferences."""
    results = []
    for item in MERCHANT_CATALOG.values():
        if in_stock_only and item.stock <= 0:
            continue
        if category_whitelist and item.category not in category_whitelist:
            continue
        if max_price is not None and item.price > max_price:
            continue
        if query:
            q = query.lower()
            match_name = q in item.name.lower()
            match_desc = item.description and q in item.description.lower()
            match_tags = any(q in t.lower() for t in item.tags)
            if not (match_name or match_desc or match_tags):
                continue
        results.append(item)
    return results
