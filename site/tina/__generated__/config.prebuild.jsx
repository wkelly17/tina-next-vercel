var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// tina/media/r2MediaStore.ts
var r2MediaStore_exports = {};
__export(r2MediaStore_exports, {
  default: () => r2MediaStore
});
import { DEFAULT_MEDIA_UPLOAD_TYPES } from "tinacms";
var r2MediaStore;
var init_r2MediaStore = __esm({
  "tina/media/r2MediaStore.ts"() {
    "use strict";
    r2MediaStore = class {
      constructor() {
        this.accept = DEFAULT_MEDIA_UPLOAD_TYPES;
      }
      async list(options) {
        const query = this.buildQuery(options);
        const response = await fetch("/api/media" + query);
        const { items, offset } = await response.json();
        return {
          items,
          nextOffset: offset
        };
      }
      async persist(media) {
        const newFiles = [];
        for (const item of media) {
          const { file, directory } = item;
          const formData = new FormData();
          formData.append("file", file);
          formData.append("directory", directory);
          formData.append("filename", file.name);
          const res = await fetch(`/api/media`, {
            method: "POST",
            body: formData
          });
          if (res.status != 200) {
            const responseData = await res.json();
            throw new Error(responseData.message);
          }
          const fileRes = await res.json();
          await new Promise((resolve) => {
            setTimeout(resolve, 3e3);
          });
          newFiles.push(fileRes);
        }
        return newFiles;
      }
      async delete(media) {
        await fetch(`/api/media?del=${encodeURIComponent(media.id)}`, {
          method: "DELETE"
        });
      }
      buildQuery(options) {
        const params = Object.keys(options).filter((key) => options[key] !== "" && options[key] !== void 0).map((key) => `${key}=${options[key]}`).join("&");
        return `?${params}`;
      }
    };
  }
});

// tina/config.ts
import { defineConfig, LocalAuthProvider } from "tinacms";

// tina/authProviderConfig.ts
import { AbstractAuthProvider } from "tinacms";
var CustomAuthProvider = class extends AbstractAuthProvider {
  constructor() {
    super();
  }
  async authenticate(props) {
    const url = `${window.location.origin}/api/auth/login`;
    return window.location.replace(url);
  }
  async getToken() {
    const url = `${window.location.origin}/api/auth/authenticate`;
    try {
      const userRes = await fetch(url);
      const data = await userRes.json();
      if (data.token) {
        return {
          id_token: data.token
        };
      } else {
        return {
          id_token: null
        };
      }
    } catch (error) {
      console.log(error);
      return {
        id_token: null
      };
    }
  }
  async getUser() {
    const url = `${window.location.origin}/api/auth/authenticate`;
    try {
      const userRes = await fetch(url);
      if (userRes.status === 200) {
        return true;
      } else
        return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  async logout() {
    const url = `${window.location.origin}/api/auth/logout`;
    return window.location.replace(url);
  }
  async authorize(context) {
    return {
      isAuthorized: true
    };
  }
};

// tina/richTextTemplate.tsx
function gridTemplate() {
  return {
    name: "Grid",
    label: "Grid",
    fields: [
      {
        type: "string",
        name: "class",
        label: "CSS Classes",
        ui: {
          component: "textarea"
        }
      },
      {
        type: "string",
        name: "colMinWidth",
        label: "Col. Min Width"
      },
      {
        type: "string",
        name: "colMaxWidth",
        label: "Col. Max Width"
      },
      {
        type: "rich-text",
        name: "children",
        label: "Content",
        templates: []
      }
    ]
  };
}
function colTemplate() {
  return {
    name: "Column",
    label: "Column",
    fields: [
      {
        type: "string",
        name: "class",
        label: "CSS Classes",
        ui: {
          component: "textarea"
        }
      },
      {
        type: "string",
        name: "colMaxWidth",
        label: "Col. Max Width"
      },
      {
        type: "rich-text",
        name: "children",
        label: "children",
        templates: []
      }
    ]
  };
}
var boxes = createLimitedDepthTemplate(boxTemplate(), 4, [
  boxTemplate(),
  gridTemplate(),
  colTemplate()
  // partialField(),
  // iconTemplate(),
]);
var grids = createLimitedDepthTemplate(gridTemplate(), 3, [
  gridTemplate(),
  colTemplate()
  // iconTemplate(),
]);
var cols = createLimitedDepthTemplate(colTemplate(), 3, [
  gridTemplate(),
  boxTemplate()
  // iconTemplate(),
]);
function boxTemplate() {
  return {
    name: "Box",
    label: "Box",
    fields: [
      {
        type: "string",
        name: "class",
        label: "CSS Classes",
        ui: {
          component: "textarea"
        }
      },
      {
        type: "string",
        name: "bgImage",
        label: "Background Image"
      },
      {
        type: "rich-text",
        name: "children",
        label: "children",
        templates: []
      }
    ]
  };
}
function createLimitedDepthTemplate(template, depth, templatesToAddIn) {
  if (depth <= 0) {
    return template;
  } else {
    return {
      ...template,
      fields: template.fields.map((field) => {
        if (field.type === "rich-text") {
          return {
            ...field,
            templates: templatesToAddIn.map((temp) => {
              return createLimitedDepthTemplate(
                temp,
                depth - 1,
                templatesToAddIn
              );
            })
          };
        } else {
          return field;
        }
      })
    };
  }
}
var richTextTemplates = [
  grids,
  cols,
  boxes
  // icons,
  // partialField(),
];

// tina/collections/page.ts
var PageCollection = {
  name: "page",
  label: "Page",
  path: "content",
  match: {
    include: "**/pages/*"
  },
  format: "mdx",
  frontmatterFormat: "yaml",
  ui: {
    router: (args) => {
      if (args.document._sys.breadcrumbs.join("/").includes("/pages/home")) {
        return `/preview/${args.document._sys.breadcrumbs[0]}`;
      } else {
        const val = `/preview/${args.document._sys.breadcrumbs.join("/")}`;
        return val;
      }
    },
    beforeSubmit: async ({
      form,
      cms,
      values
    }) => {
      const finalVal = {
        ...values,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!finalVal.created) {
        finalVal.created = (/* @__PURE__ */ new Date()).toISOString();
      }
      return finalVal;
    }
  },
  defaultItem: () => {
    return {
      title: "Page Title",
      localize: true,
      created: (/* @__PURE__ */ new Date()).toISOString(),
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      filename: "/en/pages/lower-file-name-no-spaces",
      draft: true
    };
  },
  fields: [
    {
      type: "string",
      label: "Title",
      name: "title"
    },
    {
      type: "boolean",
      name: "draft",
      label: "Draft",
      description: "Pages that are marked as a draft are only viewable while logged in as an admin."
    },
    {
      type: "rich-text",
      name: "body",
      isBody: true,
      label: "Body",
      templates: richTextTemplates
    },
    {
      type: "boolean",
      name: "localize",
      label: "Localize",
      description: "Choose whether you want this page localized or not. (Defaults to true if not save)"
    },
    {
      type: "datetime",
      name: "created",
      label: "created",
      description: "When this page was created (done automatically on creation of page)"
    },
    {
      type: "datetime",
      name: "lastUpdated",
      label: "Last Updated",
      description: "When this page was last updated (done automatically on save)"
    },
    {
      type: "string",
      label: "sha256 hash",
      name: "sha256",
      description: "Generated programmatically. Used for automatic translation."
    }
  ]
};

// tina/collections/locales.ts
var LocalesCollection = {
  name: "locales",
  label: "Locales",
  path: "siteConfig",
  match: {
    include: "locales"
  },
  format: "json",
  ui: {
    allowedActions: {
      create: false,
      delete: false
    }
  },
  fields: [
    {
      name: "locales",
      label: "Locale info",
      type: "object",
      list: true,
      ui: {
        itemProps: (item) => {
          return { label: item?.name };
        }
      },
      fields: [
        {
          name: "code",
          label: "Lang code",
          type: "string",
          required: true
        },
        {
          name: "name",
          label: "Name",
          type: "string",
          required: true
        },
        {
          name: "nativeName",
          label: "nativeName",
          type: "string",
          required: true
        },
        {
          name: "direction",
          label: "Language Direction",
          type: "string",
          required: true,
          options: [
            { value: "ltr", label: "ltr" },
            { value: "rtl", label: "rtl" }
          ]
        },
        {
          name: "flag",
          label: "An svg flag for the country",
          required: false,
          type: "string",
          ui: {
            component: "textarea"
          }
        }
      ]
    }
  ]
};

// tina/collections/partials.ts
var PartialCollection = {
  name: "partials",
  label: "Partials",
  path: "content",
  match: {
    include: "**/partials/*"
  },
  defaultItem: () => {
    return {
      name: "Name of partial",
      content: {
        type: "root",
        children: [
          {
            type: "p",
            children: [
              {
                type: "text",
                text: "Default Text"
              }
            ]
          }
        ]
      },
      filename: "/en/partials/partialName"
    };
  },
  format: "mdx",
  frontmatterFormat: "yaml",
  fields: [
    {
      name: "name",
      type: "string",
      label: "Partial Name",
      description: "For id purposes"
    },
    {
      name: "content",
      type: "rich-text",
      label: "Partial content",
      isBody: true,
      templates: richTextTemplates,
      parser: {
        type: "mdx"
      }
    },
    {
      type: "string",
      label: "sha256 hash",
      name: "sha256",
      description: "Generated programmatically. Used for automatic translation."
    }
  ]
};

// tina/collections/menu.ts
var MenuCollection = {
  name: "headerMenu",
  label: "Header Nav",
  path: "content",
  match: {
    include: "**/menus/*"
  },
  format: "json",
  fields: [
    {
      name: "logo",
      label: "Logo",
      type: "image",
      ui: {
        // is called on every form change but result is stored in data and not in the form value (saved to file but not displayed to the user)
        parse: (val) => {
          if ("src" in val) {
            return val.src;
          } else {
            return val;
          }
        }
      }
    },
    {
      name: "menuLinks",
      label: "Menu Links",
      list: true,
      type: "object",
      ui: {
        itemProps: (item) => {
          return { label: item?.url };
        },
        defaultItem: {
          url: "/pages/file",
          localize: true,
          label: "Link label",
          description: "Some extra description about this link"
        }
      },
      fields: [
        {
          name: "url",
          label: "url",
          description: "(format of /pages/filename, e.g /pages/dot) (locale code will be added automatically if localize is true)",
          type: "string"
        },
        {
          name: "isInteral",
          label: "Is Internal Link",
          description: "Is this page on this site? If so, some processing will be done to keep translations consistent.  Otherwise the url will be left alone",
          type: "boolean"
        },
        {
          name: "localize",
          label: "localize",
          description: "Localize this link? This will automatically translate the label and descriptions",
          type: "boolean"
        },
        {
          name: "label",
          label: "label",
          description: "Label for the link",
          type: "string"
        },
        {
          name: "icon",
          type: "string",
          label: "icon"
        },
        {
          name: "description",
          label: "description",
          type: "string",
          ui: {
            component: "textarea"
          }
        },
        {
          name: "submenuItem",
          label: "Submenu",
          type: "object",
          fields: [
            {
              name: "subItem",
              type: "object",
              list: true,
              ui: {
                itemProps: (item) => {
                  return { label: item?.label };
                },
                defaultItem: {
                  url: "/pages/file",
                  localize: true,
                  label: "Link label",
                  description: "Some extra description about this link"
                }
              },
              fields: [
                {
                  name: "url",
                  label: "URL",
                  type: "string"
                },
                {
                  name: "isInteral",
                  label: "Is Internal Link",
                  description: "Is this page on this site? If so, some processing will be done to keep translations consistent.  Otherwise the url will be left alone",
                  type: "boolean"
                },
                {
                  name: "localize",
                  label: "localize",
                  description: "Localize this link? This will automatically translate the label and descriptions",
                  type: "boolean"
                },
                {
                  name: "label",
                  label: "Submenu label",
                  type: "string"
                },
                {
                  name: "description",
                  label: "Submenu Description",
                  type: "string",
                  ui: {
                    component: "textarea"
                  }
                }
              ]
            },
            {
              name: "nestedMenu",
              label: "Submenu Children",
              description: "Used to nest another layer of menus",
              type: "object",
              list: true,
              ui: {
                itemProps: (item) => {
                  return { label: item?.groupLabel };
                }
              },
              fields: [
                {
                  name: "groupLabel",
                  label: "Submenu Children Group Label",
                  description: "Label for this group of menus",
                  type: "string"
                },
                {
                  name: "submenuChildren",
                  label: "Nested Children for submenu",
                  type: "object",
                  list: true,
                  ui: {
                    itemProps: (item) => {
                      return { label: item?.label };
                    },
                    defaultItem: {
                      url: "/pages/filename",
                      label: "title",
                      description: "lorem desc;",
                      localize: true
                    }
                  },
                  fields: [
                    {
                      name: "url",
                      label: "URL",
                      type: "string"
                    },
                    {
                      name: "isInteral",
                      label: "Is Internal Link",
                      description: "Is this page on this site? If so, some processing will be done to keep translations consistent.  Otherwise the url will be left alone",
                      type: "boolean"
                    },
                    {
                      name: "localize",
                      label: "localize",
                      description: "Localize this link? This will automatically translate the label and descriptions",
                      type: "boolean"
                    },
                    {
                      name: "label",
                      label: "Submenu label",
                      type: "string"
                    },
                    {
                      name: "description",
                      label: "Submenu Description",
                      type: "string",
                      ui: {
                        component: "textarea"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      type: "string",
      label: "sha256 hash",
      name: "sha256",
      description: "Generated programmatically with reference to the menu. Used for automatic translation."
    }
  ]
};

// tina/config.ts
var isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
var config_default = defineConfig({
  authProvider: isLocal ? new LocalAuthProvider() : new CustomAuthProvider(),
  contentApiUrlOverride: "/api/content",
  build: {
    publicFolder: "public",
    outputFolder: "admin"
  },
  media: {
    loadCustomStore: async () => {
      const pack = await Promise.resolve().then(() => (init_r2MediaStore(), r2MediaStore_exports));
      return pack.default;
    }
  },
  schema: {
    collections: [
      PageCollection,
      LocalesCollection,
      PartialCollection,
      MenuCollection
    ]
  }
});
export {
  config_default as default
};
