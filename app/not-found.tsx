import Link from "next/link";
import { FullPageNotice } from "@/components/full-page-notice";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <FullPageNotice
      code="404"
      badge="Page not found"
      title="This page does not exist"
      description="The link may be broken or the page was removed. You can head back to the dashboard to continue."
    >
      <Button asChild className="w-full sm:w-auto">
        <Link href="/">Return to dashboard</Link>
      </Button>
    </FullPageNotice>
  );
}
