"use client";

import { BookSkeleton } from "@/components/skeleton";
import { AwaitSearch } from "@/components/suspense";
import { BookScreen } from "@/features/book-screens";

export default function Page() {
  return (
    <AwaitSearch fallback={<BookSkeleton />}>
      <BookScreen />
    </AwaitSearch>
  );
}
