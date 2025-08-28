import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { File } from "@/models/File";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address"); // blob key
  if (!address) {
    return NextResponse.json(
      { result: false, message: "파일이 존재하지 않습니다." },
      { status: 400 }
    );
  }
  const fileDoc = await File.findOne({ address });
  if (!fileDoc?.url) {
    return NextResponse.json(
      { result: false, message: "파일이 존재하지 않습니다." },
      { status: 404 }
    );
  }
  // Redirect to public Blob URL
  return NextResponse.redirect(fileDoc.url, 302);
}
