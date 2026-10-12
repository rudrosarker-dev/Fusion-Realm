"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/primitives";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x flex min-h-[70svh] flex-col items-center justify-center pt-32 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">A loose thread.</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ash">
        An unexpected error occurred while rendering this page. Please try again — if it keeps happening, tell the studio.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button href="/" variant="outline">
          Home
        </Button>
      </div>
    </div>
  );
}
