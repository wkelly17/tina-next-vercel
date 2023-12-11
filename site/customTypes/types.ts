import msal from "@azure/msal-node";
import {ReadonlyRequestCookies} from "next/dist/server/web/spec-extension/adapters/request-cookies";

export type msalConfigType = msal.Configuration;

export type loginOptions = {
  scopes: Array<string>;
  redirectUri: string;
  successRedirect: string;
  request: Request;
  cookieManager: ReadonlyRequestCookies;
};
export type redirectToAuthCodeUrlParams = {
  authCodeUrlRequestParams: any;
  authCodeRequestParams: any;
  msalInstance: msal.ConfidentialClientApplication;
  request: Request;
  cookieManager: ReadonlyRequestCookies;
};
export type handleRedirectParams = {
  request: Request;
  cookieManager: ReadonlyRequestCookies;
};
export type getTokenParams = {
  redirectUri: string;
  scopes: Array<string>;
  request: Request;
  cookieManager: ReadonlyRequestCookies;
  successRedirect: string;
  concatenatedIndex: string;
};
