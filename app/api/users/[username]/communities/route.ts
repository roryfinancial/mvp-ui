import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  const { communities } = await req.json();
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { communities },
  });
  return NextResponse.json({ success: true, data: { communities: user.communities }, error: null });
}
