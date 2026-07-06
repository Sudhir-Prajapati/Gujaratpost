import type { NextRequest } from "next/server";
import { AuthService } from "@/server/services/auth.service";

export async function POST(req: NextRequest) {
  return AuthService.register(req);
}
