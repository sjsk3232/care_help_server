import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { dbConnect } from "@/lib/db";
import { Admin } from "@/models/Admin";
import { isEmptyOrSpaces } from "@/lib/helpers";

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const { id, password, name } = body || {};

  if (
    isEmptyOrSpaces(id) ||
    isEmptyOrSpaces(password) ||
    isEmptyOrSpaces(name)
  ) {
    return NextResponse.json(
      { result: false, message: "가입 필수 항목이 입력되지 않았습니다." },
      { status: 400 }
    );
  }

  const exist = await Admin.findOne({ id });
  if (exist) {
    return NextResponse.json(
      { result: false, message: "이미 가입되어 있는 아이디입니다." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 12);
  const doc = new Admin({ id, password: hash, name });
  await doc.save();
  return NextResponse.json({
    result: true,
    message: "회원가입이 완료되었습니다.",
  });
}
