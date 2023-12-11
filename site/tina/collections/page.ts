import {Collection, Form, TinaCMS} from "tinacms";
import {richTextTemplates} from "../richTextTemplate";
// en / es  -> pages yada yad or
// pages / en & es
// pages / es

export const PageCollection: Collection = {
  name: "page",
  label: "Page",
  path: "content",
  match: {
    include: "**/pages/*",
  },
  format: "mdx",
  frontmatterFormat: "yaml",
  ui: {
    router: (args) => {
      if (args.document._sys.breadcrumbs.join("/").includes("/pages/home")) {
        // const val = args.document._sys.breadcrumbs.join("/");
        return `/preview/${args.document._sys.breadcrumbs[0]}`;
      } else {
        const val = `/preview/${args.document._sys.breadcrumbs.join("/")}`;
        return val;
      }
    },
    beforeSubmit: async ({
      form,
      cms,
      values,
    }: {
      form: Form;
      cms: TinaCMS;
      values: Record<string, any>;
    }) => {
      const finalVal: Record<string, any> = {
        ...values,
        lastUpdated: new Date().toISOString(),
      };
      if (!finalVal.created) {
        finalVal.created = new Date().toISOString();
      }
      // Explicit false.  If a page is created an no value set, default it to true
      return finalVal;
    },
  },
  defaultItem: () => {
    return {
      title: "Page Title",
      localize: true,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      filename: "/en/pages/lower-file-name-no-spaces",
      draft: true,
    };
  },
  fields: [
    {
      type: "string",
      label: "Title",
      name: "title",
    },
    {
      type: "boolean",
      name: "draft",
      label: "Draft",
      description:
        "Pages that are marked as a draft are only viewable while logged in as an admin.",
    },
    {
      type: "rich-text",
      name: "body",
      isBody: true,
      label: "Body",
      templates: richTextTemplates,
    },
    {
      type: "boolean",
      name: "localize",
      label: "Localize",
      description:
        "Choose whether you want this page localized or not. (Defaults to true if not save)",
    },
    {
      type: "datetime",
      name: "created",
      label: "created",
      description:
        "When this page was created (done automatically on creation of page)",
    },
    {
      type: "datetime",
      name: "lastUpdated",
      label: "Last Updated",
      description:
        "When this page was last updated (done automatically on save)",
    },
    {
      type: "string",
      label: "sha256 hash",
      name: "sha256",
      description:
        "Generated programmatically. Used for automatic translation.",
    },
  ],
};
