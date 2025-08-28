import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Admin } from '@/models/Admin';
import { verifyAuthHeader } from '@/lib/jwt';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const decoded = verifyAuthHeader(req.headers.get('authorization') || undefined);
    const user = await Admin.findOne({ id: (decoded as any).id });
    if (!user) {
      return NextResponse.json({ result: false, message: '존재하지 않는 아이디입니다.' }, { status: 404 });
    }
    return NextResponse.json({ result: true, message: '로그인이 되어있습니다.' });
  } catch (e: any) {
    const status = e.name === 'TokenExpiredError' ? 419 : 401;
    return NextResponse.json({ result: false, message: e.message }, { status });
  }
}
