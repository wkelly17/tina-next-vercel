import {Collection, Form, TinaCMS} from "tinacms";
// en / es  -> pages yada yad or
// pages / en & es
// pages / es

export const LocalesCollection: Collection = {
  name: "locales",
  label: "Locales",
  path: "siteConfig",
  match: {
    include: "locales",
  },
  format: "json",
  ui: {
    allowedActions: {
      create: false,
      delete: false,
    },
  },
  fields: [
    {
      name: "locales",
      label: "Locale info",
      type: "object",
      list: true,
      ui: {
        itemProps: (item) => {
          // Field values are accessed by item?.<Field name>
          return {label: item?.name};
        },
      },
      fields: [
        {
          name: "code",
          label: "Lang code",
          type: "string",
          required: true,
        },
        {
          name: "name",
          label: "Name",
          type: "string",
          required: true,
        },
        {
          name: "nativeName",
          label: "nativeName",
          type: "string",
          required: true,
        },
        {
          name: "direction",
          label: "Language Direction",
          type: "string",
          required: true,
          options: [
            {value: "ltr", label: "ltr"},
            {value: "rtl", label: "rtl"},
          ],
        },
        {
          name: "flag",
          label: "An svg flag for the country",
          required: false,
          type: "string",
          ui: {
            component: "textarea",
          },
        },
      ],
    },
  ],
};
