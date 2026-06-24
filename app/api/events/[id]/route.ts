import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ok,
  badRequest,
  notFound,
  forbidden,
  unauthorized,
  getSessionUser,
} from "@/lib/api-helpers";

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

// GET /api/events/{id} — public read by id, no visibility/ownership filter.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return notFound("Event not found");
  return ok(toResponse(event));
}

// PUT /api/events/{id} — owner-only partial update (non-null fields applied).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return notFound("Event not found");
  if (event.creatorId !== me.id) {
    return forbidden("You can only modify your own events");
  }

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid request body");

  const data: {
    title?: string;
    description?: string;
    eventDate?: string;
    eventTime?: string;
    location?: string;
    imageUrl?: string;
    isPublic?: boolean;
  } = {};

  if (body.title != null) {
    const title = String(body.title).trim();
    if (!title) return badRequest("Title cannot be blank");
    if (title.length > 200) return badRequest("Title must be at most 200 characters");
    data.title = title;
  }
  if (body.description != null) {
    if (String(body.description).length > 2000)
      return badRequest("Description must be at most 2000 characters");
    data.description = body.description;
  }
  if (body.eventDate != null) data.eventDate = body.eventDate;
  if (body.eventTime != null) {
    if (String(body.eventTime).length > 10)
      return badRequest("Event time must be at most 10 characters");
    data.eventTime = body.eventTime;
  }
  if (body.location != null) {
    if (String(body.location).length > 500)
      return badRequest("Location must be at most 500 characters");
    data.location = body.location;
  }
  if (body.imageUrl != null) {
    if (String(body.imageUrl).length > 500)
      return badRequest("Image URL must be at most 500 characters");
    data.imageUrl = body.imageUrl;
  }
  if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;

  const updated = await prisma.event.update({ where: { id }, data });
  return ok(toResponse(updated));
}

// DELETE /api/events/{id} — owner-only hard delete.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return notFound("Event not found");
  if (event.creatorId !== me.id) {
    return forbidden("You can only modify your own events");
  }

  await prisma.event.delete({ where: { id } });
  return ok(null);
}
