import jwt from "jsonwebtoken";

export function signToken(payload: object) {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.EXPIRE_SECOND
    ? `${process.env.EXPIRE_SECOND}s`
    : "3600s";
  return jwt.sign(payload, secret, { expiresIn, issuer: "senior_love" });
}

export function verifyAuthHeader(token?: string) {
  if (!token) {
    const err: any = new Error("토큰이 존재하지 않습니다.");
    err.name = "NotExistTokenError";
    throw err;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as any;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      const err: any = new Error("토큰이 만료되었습니다");
      err.name = "TokenExpiredError";
      throw err;
    }
    throw error;
  }
}
