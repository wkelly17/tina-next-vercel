import type {Template} from "tinacms";
// import {EditorFormLink} from "@/app/components/Link/EditorFormLink";
// import {IconOptions} from "@/app/components/Icons";
// export const richTextTemplates: Array<Template> = [
//   gridTemplate(),
//   colTemplate(),
//   customLinkTemplate(),
//   // boxTemplate(),
//   boxes,
// ];

function gridTemplate(): Template {
  return {
    name: "Grid",
    label: "Grid",
    fields: [
      {
        type: "string",
        name: "class",
        label: "CSS Classes",
        ui: {
          component: "textarea",
        },
      },
      {
        type: "string",
        name: "colMinWidth",
        label: "Col. Min Width",
      },
      {
        type: "string",
        name: "colMaxWidth",
        label: "Col. Max Width",
      },
      {
        type: "rich-text",
        name: "children",
        label: "Content",

        templates: [],
      },
    ],
  };
}
function colTemplate(): Template {
  return {
    name: "Column",
    label: "Column",
    fields: [
      {
        type: "string",
        name: "class",
        label: "CSS Classes",
        ui: {
          component: "textarea",
        },
      },
      {
        type: "string",
        name: "colMaxWidth",
        label: "Col. Max Width",
      },
      {
        type: "rich-text",
        name: "children",
        label: "children",

        templates: [],
      },
    ],
  };
}
// function partialField(): Template {
//   return {
//     name: "Partial",
//     label: "Reference a partial",
//     fields: [
//       {
//         type: "reference",
//         collections: ["partials"],
//         name: "referencedPartial",
//       },
//     ],
//   };
// }
// function iconTemplate(): Template {
//   return {
//     name: "Icon",
//     label: "An Icon",
//     // @ts-ignore
//     // inline: true,
//     fields: [
//       {
//         type: "string",
//         // options: IconOptions,
//         label: "Icon",
//         name: "iconName",
//       },
//       {
//         type: "string",
//         name: "class",
//         label: "CSS Classes",
//         ui: {
//           component: "textarea",
//         },
//       },
//     ],
//   };
// }
const boxes = createLimitedDepthTemplate(boxTemplate(), 4, [
  boxTemplate(),
  gridTemplate(),
  colTemplate(),
  // partialField(),
  // iconTemplate(),
]);
// const textTemplates = createLimitedDepthTemplate(TextTemplate(), 2, [
//   TextTemplate(),
// ]);
const grids = createLimitedDepthTemplate(gridTemplate(), 3, [
  gridTemplate(),
  colTemplate(),
  // iconTemplate(),
]);
const cols = createLimitedDepthTemplate(colTemplate(), 3, [
  gridTemplate(),
  boxTemplate(),
  // iconTemplate(),
]);
// const icons = createLimitedDepthTemplate(iconTemplate(), 1, []);

function boxTemplate(): Template {
  return {
    name: "Box",
    label: "Box",
    fields: [
      {
        type: "string",
        name: "class",
        label: "CSS Classes",
        ui: {
          component: "textarea",
        },
      },
      {
        type: "string",
        name: "bgImage",
        label: "Background Image",
      },
      {
        type: "rich-text",
        name: "children",
        label: "children",

        templates: [],
      },
    ],
  };
}
// function TextTemplate(): Template {
//   return {
//     name: "Text",
//     label: "Text",
//     fields: [
//       {
//         type: "string",
//         name: "as",
//         label: "Tag (default p)",
//       },
//       {
//         type: "rich-text",
//         name: "children",
//         label: "Content",
//         templates: [],
//       },
//       {
//         type: "string",
//         name: "classes",
//         label: "CSS Classes",
//         ui: {
//           component: "textarea",
//         },
//       },
//     ],
//   };
// }

function createLimitedDepthTemplate(
  template: Template,
  depth: number,
  templatesToAddIn: Array<Template>
): any {
  // console.count("createLimitedDepthTemplate");
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
            }),
          };
        } else {
          return field;
        }
      }),
    };
  }
}

export const richTextTemplates: Array<Template> = [
  grids,
  cols,
  boxes,
  // icons,
  // partialField(),
];
