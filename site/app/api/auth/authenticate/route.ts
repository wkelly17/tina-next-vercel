"use server";
import {NextRequest} from "next/server";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {checkJwtValid} from "@/utils/auth";
import {authProvider} from "@/lib/authProvider";

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const existingId = cookieStore.get("oauthjwt");
  if (!existingId) {
    return new Response(null, {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  let parsedCookie = JSON.parse(existingId.value);
  let hasExistingValidJwt = checkJwtValid(parsedCookie?.id);
  if (hasExistingValidJwt) {
    const body = JSON.stringify({
      ok: hasExistingValidJwt,
      token: parsedCookie.id,
    });
    return new Response(body, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } else {
    return new Response(null, {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const absoluteRedirectUri = `${url.origin}/admin/index.html`;
  const absoluteRedirectFailure = `${url.origin}`;
  const cookieStore = cookies();
  const session = await authProvider.handleRedirect({
    request,
    cookieManager: cookieStore,
  });

  // console.log(cookies.get("session"));
  if (session?.isAuthenticated) {
    return redirect(absoluteRedirectUri);
  } else {
    return redirect(absoluteRedirectFailure);
  }
}
