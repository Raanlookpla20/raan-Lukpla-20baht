import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image: string | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <Image
          src={product.image ?? "/images/product-placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">
            สินค้าหมด
          </span>
        )}
        {!soldOut && product.compareAtPrice && (
          <span className="absolute left-2 top-2 rounded-full bg-danger-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            ลดราคา
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-slate-800">{product.name}</h3>
        <div className="mt-auto flex items-baseline gap-1.5 pt-1">
          <span className="text-base font-bold text-primary-600">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs text-slate-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>
        <button
          disabled={soldOut}
          tabIndex={-1}
          className="mt-2 w-full rounded-full bg-primary-500 py-1.5 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {soldOut ? "สินค้าหมด" : "สั่งซื้อ"}
        </button>
      </div>
    </Link>
  );
}
