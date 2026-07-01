"use client";

import { useRouter } from "next/navigation";
import { CliveStudyHub } from "@/components/chapter1/CliveStudyHub";
import { chapter1BookHref } from "@/lib/chapter1/hub-books";
import type { HubBookId } from "@/lib/chapter1/hub-books";

export function CliveStudyRoom() {
  const router = useRouter();

  const handleSelectBook = (book: HubBookId) => {
    router.push(chapter1BookHref(book));
  };

  return <CliveStudyHub onSelectBook={handleSelectBook} />;
}
