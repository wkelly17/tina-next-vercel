import {visit} from "unist-util-visit";

export function prefixInternalLinksWithLangCode(
  tree: any,
  languageCode: string
): any {
  return visit(tree, (node: any) => {
    if (node.type == "a") {
      if (node.url?.startsWith("http")) {
        // noop external fully qualified links
      } else if (node.url?.startsWith("#")) {
        // noop: hash link
      } else {
        // already prefixed
        if (node.url.includes(`/${languageCode}/`)) return;

        // /x/y
        if (
          node.url.startsWith("/") &&
          !node.url.startsWith(`/${languageCode}`)
        ) {
          // '/pages/processes'
          node.url = `/${languageCode}${node.url}`;
          // '/es/pages/processes'
        } else if (node.url.startsWith(".")) {
          const firstSlashIdx = node.url.indexOf("/");

          const prefixedWithLang = `${node.url.slice(
            0,
            firstSlashIdx
          )}/${languageCode}${node.url.slice(firstSlashIdx)}`;
          node.url = prefixedWithLang;
        } else {
          // pages/processes
          node.url = `${languageCode}${node.url}`;
          // en/pages/processes
        }
      }
    }
    //tina uses an atypical tree in putting props in it that alos have children
    if (node.props?.children) {
      return prefixInternalLinksWithLangCode(node.props.children, languageCode);
    } else return tree;
  });
}
