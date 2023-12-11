import * as jose from "jose";

export function checkJwtValid(jwt: string) {
  try {
    const parsedJwt = jose.decodeJwt(jwt);
    // https://learn.microsoft.com/en-us/azure/active-directory/develop/id-tokens
    const validAud = parsedJwt.aud == process.env.MS_APP_ID;
    const validTenant =
      parsedJwt.tid && parsedJwt.tid == process.env.MS_TENANT_ID;
    let hasExistingValidJwt = Boolean(validAud && validTenant);
    return hasExistingValidJwt;
  } catch (err) {
    console.log({err});
    return false;
  }
}
