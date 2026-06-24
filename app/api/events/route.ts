import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, unauthorized, getSessionUser } from "@/lib/api-helpers";

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

// GET /api/events — all events (public + private) owned by the authenticated user.
export async function GET() {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const events = await prisma.event.findMany({
    where: { creatorId: me.id },
    orderBy: { eventDate: "asc" },
  });
  return ok(events.map(toResponse));
}

// POST /api/events — create an event for the authenticated user.
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid request body");

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return badRequest("Title is required");
  if (title.length > 200) return badRequest("Title must be at most 200 characters");
  if (typeof body.eventDate !== "string" || !body.eventDate) {
    return badRequest("Event date is required");
  }
  if (body.description != null && String(body.description).length > 2000) {
    return badRequest("Description must be at most 2000 characters");
  }
  if (body.eventTime != null && String(body.eventTime).length > 10) {
    return badRequest("Event time must be at most 10 characters");
  }
  if (body.location != null && String(body.location).length > 500) {
    return badRequest("Location must be at most 500 characters");
  }
  if (body.imageUrl != null && String(body.imageUrl).length > 500) {
    return badRequest("Image URL must be at most 500 characters");
  }

  const created = await prisma.event.create({
    data: {
      creatorId: me.id,
      title,
      description: body.description ?? null,
      eventDate: body.eventDate,
      eventTime: body.eventTime ?? null,
      location: body.location ?? null,
      imageUrl: body.imageUrl ?? null,
      isPublic: typeof body.isPublic === "boolean" ? body.isPublic : true,
    },
  });
  return ok(toResponse(created), 201);
}
