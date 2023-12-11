export const msalConfig = {
  auth: {
    clientId: process.env.MS_APP_ID!, // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
    authority: process.env.MS_URL! + process.env.MS_TENANT_ID, // Full directory URL, in the form of https://login.microsoftonline.com/<tenant>
    clientSecret: process.env.MS_CLIENT_SECRET!, // Client secret generated from the app registration in Azure portal
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: any, message: any, containsPii: any) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

export const REDIRECT_URI = process.env.MS_REDIRECT_URI;
export const POST_LOGOUT_REDIRECT_URI = process.env.MS_POST_LOGOUT_REDIRECT_URI;
