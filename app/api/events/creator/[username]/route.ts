import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/api-helpers";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  location: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
};

function toResponse(e: EventRow) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    eventDate: e.eventDate,
    eventTime: e.eventTime,
    location: e.location,
    imageUrl: e.imageUrl,
    isPublic: e.isPublic,
    createdAt: e.createdAt.toISOString(),
  };
}

// GET /api/events/creator/{username} — public, only isPublic events for creator.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) return notFound("Creator not found");

  const events = await prisma.event.findMany({
    where: { creatorId: user.id, isPublic: true },
    orderBy: { eventDate: "asc" },
  });
  return ok(events.map(toResponse));
}
