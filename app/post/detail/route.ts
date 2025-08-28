import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Notice, Info, Qna } from "@/models/Posts";
import { isEmptyOrSpaces } from "@/lib/helpers";
import "@/models/File";

function pickModel(postType: string) {
  if (postType === "notice") return Notice;
  if (postType === "info") return Info;
  if (postType === "qna") return Qna;
  return null;
}

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const postType = searchParams.get("postType") || "";
  const postId = searchParams.get("postId") || "";

  if (isEmptyOrSpaces(postType)) {
    return NextResponse.json(
      { result: false, message: "postType이 올바르지 않습니다." },
      { status: 400 }
    );
  }
  if (isEmptyOrSpaces(postId)) {
    return NextResponse.json(
      { result: false, message: "postId가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const Model = pickModel(postType);
  if (!Model) {
    return NextResponse.json(
      { result: false, message: "postType이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const foundDetail = await Model.findByIdAndUpdate(
    postId,
    { $inc: { view: 1 } },
    { new: true } // 증가된 값이 반영된 최신 문서를 받음
  ).populate({ path: "files", model: "File" });

  if (!foundDetail) {
    return NextResponse.json(
      { result: false, message: "postId가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    result: true,
    message: "검색이 완료되었습니다.",
    foundDetail,
  });
}
