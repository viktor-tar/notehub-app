
import type { Metadata } from "next";
import { cookies } from "next/headers";

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { fetchNotes } from "@/lib/api/serverApi";
import type { NoteTag } from "@/types/note";
import NotesClient from "./Notes.client";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const tag = slug?.[0];

  const isAll = !tag || tag === "all";

  const title = isAll ? "All notes" : `${tag} notes`;

  const description = isAll
    ? "Browse all notes in NoteHub"
    : `Browse notes filtered by ${tag}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://notehub.com/notes/filter/${tag ?? "all"}`,
      images: [
        {
          url: "https://ac.goit.global/fullstack/react/notehub-og-meta.jpg",
          width: 1200,
          height: 630,
          alt: "NoteHub",
        },
      ],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const tag = slug?.[0];
  const safeTag = tag ?? "all";

  const noteTag: NoteTag | undefined =
    tag && tag !== "all" ? (tag as NoteTag) : undefined;

  const cookieHeader = (await cookies()).toString();

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({

    queryKey: ["notes", safeTag, 1, ""],
    queryFn: () =>
      fetchNotes(
        {
          page: 1,
          search: "",
          perPage: 12,
          tag: noteTag,
        },
        cookieHeader,
      ),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotesClient tag={tag} />
    </HydrationBoundary>
  );
}
