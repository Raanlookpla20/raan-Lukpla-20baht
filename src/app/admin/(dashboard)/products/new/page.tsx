import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "เพิ่มสินค้า" };

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-slate-900">เพิ่มสินค้าใหม่</h1>
      <ProductForm />
    </div>
  );
}
