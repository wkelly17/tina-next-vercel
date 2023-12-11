import {TinaMarkdown} from "tinacms/dist/rich-text";
import {Grid} from "./Grid";
import {Column} from "./Column";
import {Box} from "./Box";
import {Text} from "./Text";
// import {Partial} from "./Partial";
// import {CustomLink} from "./Link/Link";
// import {Icon} from "./Icons";
import sanitizeHtml from "sanitize-html";

const components = {
  Grid: Grid,
  Column: Column,
  // CustomLink: CustomLink,
  Box: Box,
  Text: Text,
  // Partial: Partial,
  // Icon: Icon,
  html: ({value, ...rest}: any) => {
    const clean = sanitizeHtml(value, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "iframe",
        "svg",
        "path",
      ]),
      allowedAttributes: {
        "*": ["class"],
        iframe: [
          "src",
          "allow",
          "width",
          "height",
          "title",
          "frameborder",
          "allow",
          "autoplay",
          "allowfullscreen",
        ],
        path: ["fill", "stroke", "d"],
        svg: ["class", "xmlns", "width", "height", "viewbox"],
      },
      allowedIframeHostnames: ["www.youtube.com"],
    });
    return <div dangerouslySetInnerHTML={{__html: clean}} />;
  },
};

export const TMarkDown = (props: {content: any}) => {
  return <TinaMarkdown content={props.content} components={components} />;
};
