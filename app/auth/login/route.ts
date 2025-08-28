import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { dbConnect } from "@/lib/db";
import { Admin } from "@/models/Admin";
import { signToken, verifyAuthHeader } from "@/lib/jwt";

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const { id, password } = body || {};

  const user = await Admin.findOne({ id });
  if (!user) {
    return NextResponse.json({
      result: false,
      message: "가입되지 않은 회원입니다.",
    });
  }
  const ok = await bcrypt.compare(password || "", user.password);
  if (!ok) {
    return NextResponse.json({
      result: false,
      message: "비밀번호가 올바르지 않습니다.",
    });
  }
  const token = signToken({ id: user.id });
  return NextResponse.json({
    result: true,
    message: "로그인 되었습니다.",
    token,
    expireSec: Number(process.env.EXPIRE_SECOND || 3600),
  });
}

export async function GET(req: Request) {
  // mirrors /auth/check (requires Authorization header)
  try {
    await dbConnect();
    const decoded = verifyAuthHeader(
      req.headers.get("authorization") || undefined
    );
    // Optionally ensure admin still exists:
    const user = await Admin.findOne({ id: (decoded as any).id });
    if (!user) {
      return NextResponse.json(
        { result: false, message: "존재하지 않는 아이디입니다." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      result: true,
      message: "로그인이 되어있습니다.",
    });
  } catch (e: any) {
    const status = e.name === "TokenExpiredError" ? 419 : 401;
    return NextResponse.json({ result: false, message: e.message }, { status });
  }
}
