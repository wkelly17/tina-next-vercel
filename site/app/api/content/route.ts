import {
  TinaNodeBackend,
  LocalBackendAuthProvider,
  resolve,
} from "@tinacms/datalayer";
import {AuthJsBackendAuthProvider, TinaAuthJSOptions} from "tinacms-authjs";
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
// import databaseClient from "../../../tina/__generated__/databaseClient";
import databaseClient from "@/tina/__generated__/databaseClient";
import database from "@/tina/database";
import {checkJwtValid} from "@/utils/auth";

const isAuthorized = async (request: Request) => {
  console.log("checking auth!!");
  if (process.env.NODE_ENV === "development") {
    console.log("local dev auth permitted");
    return true;
  }
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split("Bearer")?.[1]?.trim() || "";
  try {
    const isValid = checkJwtValid(token);
    return isValid;
  } catch (err) {
    console.error(err);
  }
};

export async function POST(request: Request) {
  if (await isAuthorized(request)) {
    const data = await request.json();
    const {query, variables} = data;
    const config = {
      useRelativeMedia: true,
    } as any;
    // databaseClient.request({query, variables, user:null})
    const result = await resolve({
      config,
      database,
      query,
      variables,
      verbose: true,
    });
    // console.log({result});
    // const result = await databaseRequest({query, variables});
    return new Response(JSON.stringify(result));
  }
  return new Response(null, {
    status: 403,
  });
}
