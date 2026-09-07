import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminProductsPage() {
  return <ProductsClient />;
}
