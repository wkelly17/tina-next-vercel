import {Collection, Form, TinaCMS} from "tinacms";
// en / es  -> pages yada yad or
// pages / en & es
// pages / es

export const MenuCollection: Collection = {
  name: "headerMenu",
  label: "Header Nav",
  path: "content",
  match: {
    include: "**/menus/*",
  },
  format: "json",
  fields: [
    {
      name: "logo",
      label: "Logo",
      type: "image",
      ui: {
        // is called on every form change but result is stored in data and not in the form value (saved to file but not displayed to the user)
        parse: (val: any) => {
          // These typing are not correct, and we only care about the src, so just any it;
          if ("src" in val) {
            return val.src;
          } else {
            return val;
          }
        },
      },
    },

    {
      name: "menuLinks",
      label: "Menu Links",
      list: true,
      type: "object",
      ui: {
        itemProps: (item) => {
          // Field values are accessed by item?.<Field name>
          return {label: item?.url};
        },
        defaultItem: {
          url: "/pages/file",
          localize: true,
          label: "Link label",
          description: "Some extra description about this link",
        },
      },
      fields: [
        {
          name: "url",
          label: "url",
          description:
            "(format of /pages/filename, e.g /pages/dot) (locale code will be added automatically if localize is true)",
          type: "string",
        },
        {
          name: "isInteral",
          label: "Is Internal Link",
          description:
            "Is this page on this site? If so, some processing will be done to keep translations consistent.  Otherwise the url will be left alone",
          type: "boolean",
        },
        {
          name: "localize",
          label: "localize",
          description:
            "Localize this link? This will automatically translate the label and descriptions",
          type: "boolean",
        },
        {
          name: "label",
          label: "label",
          description: "Label for the link",
          type: "string",
        },
        {
          name: "icon",
          type: "string",
          label: "icon",
        },
        {
          name: "description",
          label: "description",
          type: "string",
          ui: {
            component: "textarea",
          },
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
                  // Field values are accessed by item?.<Field name>
                  return {label: item?.label};
                },
                defaultItem: {
                  url: "/pages/file",
                  localize: true,
                  label: "Link label",
                  description: "Some extra description about this link",
                },
              },
              fields: [
                {
                  name: "url",
                  label: "URL",
                  type: "string",
                },
                {
                  name: "isInteral",
                  label: "Is Internal Link",
                  description:
                    "Is this page on this site? If so, some processing will be done to keep translations consistent.  Otherwise the url will be left alone",
                  type: "boolean",
                },
                {
                  name: "localize",
                  label: "localize",
                  description:
                    "Localize this link? This will automatically translate the label and descriptions",
                  type: "boolean",
                },
                {
                  name: "label",
                  label: "Submenu label",
                  type: "string",
                },
                {
                  name: "description",
                  label: "Submenu Description",
                  type: "string",
                  ui: {
                    component: "textarea",
                  },
                },
              ],
            },
            {
              name: "nestedMenu",
              label: "Submenu Children",
              description: "Used to nest another layer of menus",
              type: "object",
              list: true,
              ui: {
                itemProps: (item) => {
                  // Field values are accessed by item?.<Field name>
                  return {label: item?.groupLabel};
                },
              },
              fields: [
                {
                  name: "groupLabel",
                  label: "Submenu Children Group Label",
                  description: "Label for this group of menus",
                  type: "string",
                },
                {
                  name: "submenuChildren",
                  label: "Nested Children for submenu",
                  type: "object",
                  list: true,
                  ui: {
                    itemProps: (item) => {
                      // Field values are accessed by item?.<Field name>
                      return {label: item?.label};
                    },
                    defaultItem: {
                      url: "/pages/filename",
                      label: "title",
                      description: "lorem desc;",
                      localize: true,
                    },
                  },
                  fields: [
                    {
                      name: "url",
                      label: "URL",
                      type: "string",
                    },
                    {
                      name: "isInteral",
                      label: "Is Internal Link",
                      description:
                        "Is this page on this site? If so, some processing will be done to keep translations consistent.  Otherwise the url will be left alone",
                      type: "boolean",
                    },
                    {
                      name: "localize",
                      label: "localize",
                      description:
                        "Localize this link? This will automatically translate the label and descriptions",
                      type: "boolean",
                    },
                    {
                      name: "label",
                      label: "Submenu label",
                      type: "string",
                    },
                    {
                      name: "description",
                      label: "Submenu Description",
                      type: "string",

                      ui: {
                        component: "textarea",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "string",
      label: "sha256 hash",
      name: "sha256",
      description:
        "Generated programmatically with reference to the menu. Used for automatic translation.",
    },
  ],
};
