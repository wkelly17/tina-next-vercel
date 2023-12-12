import {client} from "@/tina/__generated__/databaseClient";
import {PageClient} from "@/app/components/PageClient";
import {Footer} from "@components/Footer/footerClient";
import locales from "@/siteConfig/locales.json";
import {PageQuery} from "@/tina/__generated__/types";
import {prefixInternalLinksWithLangCode} from "@/utils/localizeLinks";
import Header from "@/app/components/Menu";

//  todo: eliminate any
export default async function PreviewPage({params}: any) {
  let relativePath = params.slug.join("/") + ".mdx";
  if (params.slug.length == 1) {
    relativePath = `${params.slug[0].replaceAll("/", "")}/pages/home.mdx`; // fetch home, but url segment is chopped to just be /localeCod
  }
  const pathParts = relativePath.split("/");
  const localeCode = pathParts[0];
  const res = await client.queries.page({relativePath: relativePath});
  const data = JSON.parse(JSON.stringify(res.data)) as PageQuery;
  if (data?.page) {
    prefixInternalLinksWithLangCode(data.page.body, localeCode);
  }
  const localeOb = locales.locales.find((l) => l.code === localeCode);
  const footerPath = `${localeCode}/partials/footer.mdx`;
  const footer = await client.queries.partials({
    relativePath: footerPath,
  });
  const menuPath = `${localeCode}/menus/header.json`;
  const menuData = await client.queries.headerMenu({relativePath: menuPath});
  return (
    <div>
      <Header
        headerMenu={JSON.parse(JSON.stringify(menuData.data))}
        logo="/assets/WA-Logo-Horiz-4C-Sm.webp"
        lang={localeCode}
      />
      <PageClient
        data={JSON.parse(JSON.stringify(res.data))}
        query={res.query}
        variables={res.variables}
      />
      <Footer
        data={JSON.parse(JSON.stringify(footer.data))}
        query={footer.query}
        variables={footer.variables}
      />
    </div>
  );
}
