import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-card";
import { Button, EmptyState } from "@/components/ui/primitives";
import { searchAll } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search NOIR FORM products, categories and collections.",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const results = q.trim().length >= 2 ? searchAll(q) : [];

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36">
      <p className="eyebrow">Search</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">
        {q ? <>Results for <em className="font-light">“{q}”</em></> : "Search the collection"}
      </h1>

      {!q || q.trim().length < 2 ? (
        <EmptyState
          title="Type at least two characters to search."
          copy="Try a category like “hoodie” or “trouser”, or a collection like “studio”."
          actionLabel="Browse All Products"
          actionHref="/shop"
        />
      ) : results.length ? (
        <>
          <p className="mt-4 text-sm text-fog">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
          <div className="mt-10">
            <ProductGrid products={results} priorityCount={4} />
          </div>
        </>
      ) : (
        <div className="py-16 text-center">
          <p className="font-display text-3xl">No results for “{q}”</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ash">
            We keep the range intentionally narrow. Try a broader word — or explore the full collection instead.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/shop">Shop All</Button>
            <Button href="/collections/new-season" variant="outline">
              New Season
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
