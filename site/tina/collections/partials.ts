import {Collection, Form, TinaCMS} from "tinacms";
import {richTextTemplates} from "../richTextTemplate";
// en / es  -> pages yada yad or
// pages / en & es
// pages / es

export const PartialCollection: Collection = {
  name: "partials",
  label: "Partials",
  path: "content",
  match: {
    include: "**/partials/*",
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
                text: "Default Text",
              },
            ],
          },
        ],
      },
      filename: "/en/partials/partialName",
    };
  },
  format: "mdx",
  frontmatterFormat: "yaml",
  fields: [
    {
      name: "name",
      type: "string",
      label: "Partial Name",
      description: "For id purposes",
    },
    {
      name: "content",
      type: "rich-text",
      label: "Partial content",
      isBody: true,
      templates: richTextTemplates,
      parser: {
        type: "mdx",
      },
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
