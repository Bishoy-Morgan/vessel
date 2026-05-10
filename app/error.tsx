"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FullPageNotice } from "@/components/full-page-notice";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <FullPageNotice
      badge="Something went wrong"
      title="We hit an unexpected error"
      description={
        error.digest !== undefined
          ? `Try again or return to the dashboard. (Reference: ${error.digest})`
          : "Try again or return to the dashboard. If this keeps happening, check the logs for details."
      }
    >
      <Button type="button" className="w-full sm:w-auto" onClick={reset}>
        Try again
      </Button>
      <Button variant="secondary" className="w-full sm:w-auto" asChild>
        <Link href="/">Return to dashboard</Link>
      </Button>
    </FullPageNotice>
  );
}
