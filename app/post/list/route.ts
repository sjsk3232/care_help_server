import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Notice, Info, Qna } from '@/models/Posts';
import { isEmptyOrSpaces } from '@/lib/helpers';

function pickModel(postType: string) {
  if (postType === 'notice') return Notice;
  if (postType === 'info') return Info;
  if (postType === 'qna') return Qna;
  return null;
}

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const postType = searchParams.get('postType') || '';
  const limit = Number(searchParams.get('limit') || 10);
  const pageNum = Number(searchParams.get('pageNum') || 1);

  if (isEmptyOrSpaces(postType)) {
    return NextResponse.json({ result: false, message: 'postType이 올바르지 않습니다.' }, { status: 400 });
  }
  if (!limit || !pageNum) {
    return NextResponse.json({ result: false, message: '페이지 쿼리가 올바르지 않습니다.' }, { status: 400 });
  }

  const Model = pickModel(postType);
  if (!Model) {
    return NextResponse.json({ result: false, message: 'postType이 올바르지 않습니다.' }, { status: 400 });
  }

  const totalCount = await Model.countDocuments();
  const foundPosts = await Model.find()
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limit)
    .limit(limit);
  return NextResponse.json({ result: true, message: '검색이 완료되었습니다.', foundPosts, totalCount });
}
