import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ message: "Invalid secret token" }, { status: 401 });
    }

    const tag = searchParams.get("tag");
    const path = searchParams.get("path");

    try {
        if (tag) {
            revalidateTag(tag, { expire: 0 });
            return NextResponse.json({ revalidated: true, tag, now: Date.now() });
        }

        if (path) {
            revalidatePath(path);
            return NextResponse.json({ revalidated: true, path, now: Date.now() });
        }

        // Default: revalidate everything
        revalidatePath("/", "layout");
        return NextResponse.json({ revalidated: true, all: true, now: Date.now() });
    } catch (err) {
        const error = err as Error;
        return NextResponse.json({ message: "Revalidation failed", error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return POST(request);
}
