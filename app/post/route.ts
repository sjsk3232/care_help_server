import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Notice, Info, Qna } from "@/models/Posts";
import { File as FileModel } from "@/models/File";
import { verifyAuthHeader } from "@/lib/jwt";
import { put, del } from "@vercel/blob";
import crypto from "crypto";
import "@/models/File";

function pickModel(postType: string) {
  if (postType === "notice") return Notice;
  if (postType === "info") return Info;
  if (postType === "qna") return Qna;
  return null;
}

// Create post with files (multipart/form-data)
// fields: postType, title, writer, content
// files: "files" (one or more)
export async function POST(req: Request) {
  await dbConnect();
  // auth (admin only) - adjust if public posting is allowed
  verifyAuthHeader(req.headers.get("authorization") || undefined);

  const form = await req.formData();
  const postType = String(form.get("postType") || "");
  const title = String(form.get("title") || "");
  const writer = "관리자";
  const content = String(form.get("content") || "");

  const Model: any = pickModel(postType);
  if (!Model)
    return NextResponse.json(
      { result: false, message: "postType이 올바르지 않습니다." },
      { status: 400 }
    );
  if (!title || !content)
    return NextResponse.json(
      { result: false, message: "필수 항목이 누락되었습니다." },
      { status: 400 }
    );

  // Create post doc first
  const post = await Model.create({ title, writer, content, files: [] });

  // Upload files to Vercel Blob
  const entries = form.getAll("file");
  const fileIds: string[] = [];

  for (const entry of entries) {
    const f = entry as File;

    const ext = f.name.includes(".") ? f.name.split(".").pop() : undefined;
    const key = `${postType}/${post._id}/${crypto.randomUUID()}${
      ext ? "." + ext : ""
    }`;

    // Vercel Blob 업로드 (스트림 권장)
    const blob = await put(key, f.stream(), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN, // 환경변수 반드시 설정
      contentType: f.type || "application/octet-stream",
      addRandomSuffix: false,
    });

    // File 문서 생성 (address: key, url: blob.url)
    const fileDoc = await FileModel.create({
      name: f.name,
      address: key,
      url: blob.downloadUrl,
      postType,
      post: post._id,
    });

    fileIds.push(String(fileDoc._id));
  }

  // 3) 파일 ObjectId 배열을 게시글에 연결
  post.files = fileIds as any;
  await post.save();

  return NextResponse.json({
    result: true,
    message: "등록이 완료되었습니다.",
    id: String(post._id),
  });
}

export async function DELETE(req: Request) {
  await dbConnect();

  // 인증 (Authorization: Bearer <token>)
  verifyAuthHeader(req.headers.get("authorization") || undefined);

  const { searchParams } = new URL(req.url);
  const postType = searchParams.get("postType") || "";
  const postId = searchParams.get("postId") || "";

  const Model = pickModel(postType);
  if (!Model) {
    return NextResponse.json(
      { result: false, message: "postType이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  // 게시글 + 첨부 로드
  const post = await Model.findById(postId).populate("files");
  if (!post) {
    return NextResponse.json(
      { result: false, message: "postId가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  // Blob 파일/DB File 문서 삭제
  for (const f of post.files as any[]) {
    try {
      // address에 res.pathname을 저장해뒀다면 그대로 del 가능
      if (f.address) {
        await del(f.address, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
    } catch (e) {
      // blob 삭제 실패는 치명적 에러로 보지 않고 계속 진행
      console.error("[blobDel]", e);
    }
    await FileModel.findByIdAndDelete(f._id);
  }

  // 게시글 삭제
  await Model.findByIdAndDelete(postId);

  return NextResponse.json({ result: true, message: "삭제가 완료되었습니다." });
}
