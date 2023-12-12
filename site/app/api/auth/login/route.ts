import {authProvider} from "@/lib/authProvider";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {REDIRECT_URI} from "@/lib/authConfig";
import {NextRequest} from "next/server";

export async function GET(request: NextRequest) {
  const cookieManager = cookies();
  const redirectUrl = await authProvider.login({
    scopes: [],
    redirectUri: REDIRECT_URI!,
    successRedirect: REDIRECT_URI!,
    request: request,
    cookieManager: cookieManager,
  });
  if (!redirectUrl) {
    return new Response(null, {
      status: 500,
    });
  }
  return redirect(redirectUrl);
}
