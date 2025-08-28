import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Charge } from '@/models/Charge';
import { verifyAuthHeader } from '@/lib/jwt';

export async function GET() {
  await dbConnect();
  const found = await Charge.findOne();
  return NextResponse.json({ result: true, foundCharge: found });
}

export async function POST(req: Request) {
  await dbConnect();
  const auth = req.headers.get('authorization') || undefined;
  verifyAuthHeader(auth); // admin only
  const body = await req.json();
  const doc = new Charge(body || {});
  await doc.save();
  return NextResponse.json({ result: true, message: '생성이 완료되었습니다.', createdCharge: doc });
}

export async function PATCH(req: Request) {
  await dbConnect();
  const auth = req.headers.get('authorization') || undefined;
  verifyAuthHeader(auth);
  const body = await req.json();
  const set: any = {};
  for (const k of Object.keys(body || {})) {
    if (body[k] !== undefined) set[k] = body[k];
  }
  const updated = await Charge.findOneAndUpdate({}, { $set: set }, { new: true, upsert: true });
  return NextResponse.json({ result: true, updatedCharge: updated, message: '수정이 완료되었습니다.' });
}
