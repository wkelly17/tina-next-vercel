import {
  CryptoProvider,
  ConfidentialClientApplication,
  type Configuration,
  ResponseMode,
} from "@azure/msal-node";

import {msalConfig} from "./authConfig";
import type {
  loginOptions,
  handleRedirectParams,
  redirectToAuthCodeUrlParams,
} from "@/customTypes/types";
import {ReadonlyRequestCookies} from "next/dist/server/web/spec-extension/adapters/request-cookies";

const cookieDefaults = {
  path: "/",
  httpOnly: true,
};

class AuthProvider {
  msalConfig;
  cryptoProvider;

  constructor(msalConfig: Configuration) {
    this.msalConfig = msalConfig;
    this.cryptoProvider = new CryptoProvider();
  }

  async login(options: loginOptions) {
    /**
     * MSAL Node library allows you to pass your custom state as state parameter in the Request object.
     * The state parameter can also be used to encode information of the app's state before redirect.
     * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
     */
    const state = this.cryptoProvider.base64Encode(
      JSON.stringify({
        successRedirect: options.successRedirect || "/",
      })
    );

    const authCodeUrlRequestParams = {
      state: state,

      /**
       * By default, MSAL Node will add OIDC scopes to the auth code url request. For more information, visit:
       * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
       */
      scopes: options.scopes || [],
      redirectUri: options.redirectUri,
    };

    const authCodeRequestParams = {
      state: state,

      /**
       * By default, MSAL Node will add OIDC scopes to the auth code request. For more information, visit:
       * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
       */
      scopes: options.scopes || [],
      redirectUri: options.redirectUri,
    };

    /**
     * If the current msal configuration does not have cloudDiscoveryMetadata or authorityMetadata, we will
     * make a request to the relevant endpoints to retrieve the metadata. This allows MSAL to avoid making
     * metadata discovery calls, thereby improving performance of token acquisition process. For more, see:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/performance.md
     */
    if (
      (!this.msalConfig.auth.cloudDiscoveryMetadata ||
        !this.msalConfig.auth.authorityMetadata) &&
      this.msalConfig.auth.authority
    ) {
      const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
        this.getCloudDiscoveryMetadata(this.msalConfig.auth.authority),
        this.getAuthorityMetadata(this.msalConfig.auth.authority),
      ]);

      this.msalConfig.auth.cloudDiscoveryMetadata = JSON.stringify(
        cloudDiscoveryMetadata
      );
      this.msalConfig.auth.authorityMetadata =
        JSON.stringify(authorityMetadata);
    }

    const msalInstance = this.getMsalInstance(this.msalConfig);

    // trigger the first leg of auth code flow
    return this.redirectToAuthCodeUrl({
      authCodeUrlRequestParams,
      authCodeRequestParams,
      msalInstance,
      request: options.request,
      cookieManager: options.cookieManager,
    });
  }
  /**
   * Prepares the auth code request parameters and initiates the first leg of auth code flow
   */

  async redirectToAuthCodeUrl({
    authCodeUrlRequestParams,
    authCodeRequestParams,
    msalInstance,
    request,
    cookieManager,
  }: redirectToAuthCodeUrlParams) {
    // Generate PKCE Codes before starting the authorization flow
    const {verifier, challenge} = await this.cryptoProvider.generatePkceCodes();

    // Set generated PKCE codes and method as session vars
    const pkceCodes = {
      challengeMethod: "S256",
      verifier: verifier,
      challenge: challenge,
    };

    /**
     * By manipulating the request objects below before each request, we can obtain
     * auth artifacts with desired claims. For more information, visit:
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationurlrequest
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationcoderequest
     **/
    const authCodeUrlRequest = {
      ...authCodeUrlRequestParams,
      responseMode: ResponseMode.FORM_POST, // recommended for confidential clients
      codeChallenge: pkceCodes.challenge,
      codeChallengeMethod: pkceCodes.challengeMethod,
    };

    const authCodeRequest = {
      ...authCodeRequestParams,
      code: "",
    };

    try {
      const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(
        authCodeUrlRequest
      );
      cookieManager.set(
        "sessionAuthCodeRequest",
        authCodeRequest,
        cookieDefaults
      );
      cookieManager.set(
        "sessionPkce",
        JSON.stringify(pkceCodes),
        cookieDefaults
      );
      cookieManager.set(
        "sessionAuthCodeUrlRequest",
        authCodeUrlRequest,
        cookieDefaults
      );
      return authCodeUrlResponse;
    } catch (error) {
      console.error(error);
    }
  }

  async handleRedirect({request, cookieManager}: handleRedirectParams) {
    const formBody = await request.formData();
    let body: any = {};
    Array.from(formBody.entries()).forEach(([k, v]) => {
      body[k] = v;
    });

    if (!body || !body.state) {
      throw new Error("Error: response not found");
    }
    const pkceCodes = JSON.parse(cookieManager.get("sessionPkce")?.value || "");
    let existing: any;
    if (cookieManager.has("sessionAuthCodeRequest")) {
      const cookie = cookieManager.get("sessionAuthCodeRequest");
      if (cookie) {
        existing = JSON.parse(cookie.value);
      }
    }
    const authCodeRequest = {
      ...existing,
      code: body.code,
      codeVerifier: pkceCodes.verifier,
    };

    try {
      const msalInstance = this.getMsalInstance(this.msalConfig);
      const state = JSON.parse(this.cryptoProvider.base64Decode(body.state));

      const tokenResponse = await msalInstance.acquireTokenByCode(
        {
          ...authCodeRequest,
          redirectUri: state.successRedirect,
        },
        body
      );
      const session = {
        tokenCache: msalInstance.getTokenCache().serialize(),
        idToken: tokenResponse.idToken,
        account: tokenResponse.account,
        isAuthenticated: true,
      };

      cookieManager.set(
        "oauthjwt",
        JSON.stringify({
          id: session.idToken,
        }),
        cookieDefaults
      );

      return session;
    } catch (error) {
      console.error(error);
    }
  }

  logout(options: {
    postLogoutRedirectUri: string;
    cookieManager: ReadonlyRequestCookies;
  }) {
    const {cookieManager} = options;
    /**
     * Construct a logout URI and redirect the user to end the
     * session with Azure AD. For more information, visit:
     * https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
     */
    let logoutUri = `${this.msalConfig.auth.authority}/oauth2/v2.0/`;

    if (options.postLogoutRedirectUri) {
      logoutUri += `logout?post_logout_redirect_uri=${options.postLogoutRedirectUri}`;
    }
    cookieManager.delete("sessionAuthCodeRequest");

    cookieManager.delete("sessionPkce");
    cookieManager.delete("sessionAuthCodeUrlRequest");
    cookieManager.delete("oauthjwt");
    return logoutUri;
  }

  /**
   * Instantiates a new MSAL ConfidentialClientApplication object
   * @param msalConfig: MSAL Node Configuration object
   * @returns
   */
  getMsalInstance(msalConfig: Configuration) {
    return new ConfidentialClientApplication(msalConfig);
  }

  /**
   * Retrieves cloud discovery metadata from the /discovery/instance endpoint
   * @returns
   */
  async getCloudDiscoveryMetadata(authority: string) {
    const endpoint =
      "https://login.microsoftonline.com/common/discovery/instance";

    try {
      const params = new URLSearchParams();
      params.append("api-version", "1.1");
      params.append(
        "authorization_endpoint",
        `${authority}/oauth2/v2.0/authorize`
      );
      const urlToFetch = `${endpoint}?${params.toString()}`;
      const url = new URL(urlToFetch);
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves oidc metadata from the openid endpoint
   * @returns
   */
  async getAuthorityMetadata(authority: string) {
    const endpoint = `${authority}/v2.0/.well-known/openid-configuration`;

    try {
      const response = await fetch(endpoint);
      const data = await response.json();
    } catch (error) {
      console.log(error);
    }
  }
}

export const authProvider = new AuthProvider(msalConfig);
