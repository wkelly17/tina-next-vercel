import {
  UsernamePasswordAuthJSProvider,
  TinaUserCollection,
} from "tinacms-authjs/dist/tinacms";
import {defineConfig, LocalAuthProvider} from "tinacms";
import {CustomAuthProvider} from "./authProviderConfig";
import {PageCollection} from "./collections/page";
import {LocalesCollection} from "./collections/locales";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

export default defineConfig({
  authProvider: isLocal ? new LocalAuthProvider() : new CustomAuthProvider(),
  contentApiUrlOverride: "/api/content",
  build: {
    publicFolder: "public",
    outputFolder: "admin",
  },
  media: {
    loadCustomStore: async () => {
      const pack = await import("./media/r2MediaStore");
      return pack.default;
    },
  },
  schema: {
    collections: [PageCollection, LocalesCollection],
  },
});
