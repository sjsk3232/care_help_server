import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  const res = NextResponse.next();

  // 허용 Origin: 환경변수 FRONT_URI가 있으면 우선 사용
  res.headers.set(
    "Access-Control-Allow-Origin",
    process.env.FRONT_URI ?? origin
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Preflight 처리
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: res.headers,
    });
  }
  return res;
}

export const config = {
  matcher: ["/:path*"],
};
