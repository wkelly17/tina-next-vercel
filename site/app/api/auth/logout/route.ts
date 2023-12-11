import {authProvider} from "@/lib/authProvider";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {NextRequest} from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const url = new URL(request.url);
  const absoluteRedirectUri = `${url.origin}/`;
  const logoutUri = authProvider.logout({
    postLogoutRedirectUri: absoluteRedirectUri,
    cookieManager: cookieStore,
  });
  return redirect(logoutUri);
}
