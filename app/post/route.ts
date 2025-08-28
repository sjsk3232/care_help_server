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
  const files = form.getAll("files") as unknown as File[];
  const savedFiles: any[] = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
    const ext = (f.name || "").split(".").pop() || "";
    const key = `uploads/${postType}/${post._id}/${crypto.randomUUID()}-${
      f.name
    }`;
    const res = await put(key, f, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const fileDoc = await FileModel.create({
      name: f.name,
      address: res.pathname, // store blob key
      url: res.url, // public url
      postType,
      post: post._id,
    });
    savedFiles.push(fileDoc._id);
  }

  if (savedFiles.length) {
    post.files.push(...savedFiles);
    await post.save();
  }

  return NextResponse.json({
    result: true,
    message: "생성이 완료되었습니다.",
    createdPost: post,
  });
}

// Update post text and optionally append new files
// Accepts multipart/form-data (so we can upload new files)
// fields: postType, postId, title?, content?
// files: "files" (optional; appended)
export async function PATCH(req: Request) {
  await dbConnect();
  verifyAuthHeader(req.headers.get("authorization") || undefined);

  const form = await req.formData();
  const postType = String(form.get("postType") || "");
  const postId = String(form.get("postId") || "");
  const title = form.has("title") ? String(form.get("title") || "") : undefined;
  const content = form.has("content")
    ? String(form.get("content") || "")
    : undefined;

  const Model: any = pickModel(postType);
  if (!Model)
    return NextResponse.json(
      { result: false, message: "postType이 올바르지 않습니다." },
      { status: 400 }
    );
  const post = await Model.findById(postId);
  if (!post)
    return NextResponse.json(
      { result: false, message: "postId가 올바르지 않습니다." },
      { status: 400 }
    );

  if (typeof title === "string" && title.length) post.title = title;
  if (typeof content === "string" && content.length) post.content = content;

  const files = form.getAll("files") as unknown as File[];
  const appended: any[] = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
    const key = `uploads/${postType}/${post._id}/${crypto.randomUUID()}-${
      f.name
    }`;
    const res = await put(key, f, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const fileDoc = await FileModel.create({
      name: f.name,
      address: res.pathname,
      url: res.url,
      postType,
      post: post._id,
    });
    appended.push(fileDoc._id);
  }
  if (appended.length) post.files.push(...appended);

  await post.save();
  return NextResponse.json({
    result: true,
    message: "수정이 완료되었습니다.",
    updatedPost: post,
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
