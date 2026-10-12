import { Button } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[80svh] flex-col items-center justify-center pb-24 pt-32 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 font-display text-[22vw] leading-none sm:text-[10rem]">Lost.</h1>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-ash">
        The page you are looking for has moved, sold out, or never existed. The collection, however, is very much here.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button href="/">Back to Home</Button>
        <Button href="/shop" variant="outline">
          Shop the Collection
        </Button>
      </div>
    </div>
  );
}
