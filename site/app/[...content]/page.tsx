import {PageServer} from "@/app/components/PageServer";
import {client} from "@/tina/__generated__/databaseClient";
import {PageQuery} from "@/tina/__generated__/types";
import {prefixInternalLinksWithLangCode} from "@/utils/localizeLinks";
import * as fs from "node:fs/promises";
import path from "node:path";
import locales from "@/siteConfig/locales.json";
import {Footer} from "@components/Footer/footerServer";
import {Header} from "@components/Menu";

export async function generateStaticParams() {
  const allPages = await client.queries.pageConnection({
    filter: {
      draft: {
        eq: false,
      },
    },
  });
  let slugs = [];
  if (allPages?.data.pageConnection.edges) {
    for (const entry of allPages.data.pageConnection.edges) {
      if (entry?.node?.id) {
        // if (entry?.node?.id.includes("")) continue;
        const parts = entry.node.id.split("content/");
        const parsed = path.parse(entry?.node?.id);
        let fileName = `${parts[0]}/${parsed.name}`; //locale/kebab-case-file
        console.log({fileName});
        if (parsed.name == "/home") {
          fileName = parts[0]; //the locale /en /es
        }
        fileName = fileName.startsWith("/") ? fileName.slice(1) : fileName;
        slugs.push({
          content: [fileName],
        });
      }
    }
  }
  return slugs;
}

// todo: eliminate any
export default async function Page({params}: any) {
  // console.log({props});
  const {content} = params;
  console.log({content});
  let relativePath: string = "";
  relativePath = decodeURIComponent(content[0]) + ".mdx";
  if (Array.isArray(content) && content.length == 1) {
    relativePath = `${content[0]}/pages/home.mdx`; // fetch home, but url segment is chopped to just be /localeCode
    console.log({relativePath});
  } else {
    relativePath =
      decodeURIComponent(`${content[0]}/pages/${content.slice(1).join("/")}`) +
      ".mdx";
  }

  const isHomePage = relativePath.includes("home.mdx");
  const parts = relativePath.split("/");
  const localeCode = parts[0];
  const localeOb = locales.locales.find((l) => l.code === localeCode);
  const res = await client.queries.page({relativePath: relativePath});
  // https://github.com/vercel/next.js/issues/47447
  const data = JSON.parse(JSON.stringify(res.data)) as PageQuery;
  // mutates the data.page in place on tree
  if (data?.page) {
    prefixInternalLinksWithLangCode(data.page.body, localeCode);
  }
  const footerPath = `${localeCode}/partials/footer.mdx`;
  const footer = await client.queries.partials({
    relativePath: footerPath,
  });

  const menuPath = `${localeCode}/menus/header.json`;
  const menuData = await client.queries.headerMenu({relativePath: menuPath});
  return (
    <div>
      <div>
        <Header
          headerMenu={JSON.parse(JSON.stringify(menuData.data))}
          logo="/assets/WA-Logo-Horiz-4C-Sm.webp"
          lang={localeCode}
        />
        <PageServer data={JSON.parse(JSON.stringify(data))} />
        {/* <svg dangerouslySetInnerHTML={{__html: localeOb?.flag}} /> */}
      </div>
      <Footer data={JSON.parse(JSON.stringify(footer.data))} />
      {/* <hr />
      <h1>DEBUG INFO</h1>
      <div>
        <pre>{relativePath}</pre>
        <p>Params</p>
        <pre>{JSON.stringify(params, null, 2)}</pre>
        Res
        <pre>{JSON.stringify(res, null, 2)}</pre>
      </div> */}
    </div>
  );
}

// todo:
/* 
Home page vs not home page logic? (e.g. Urls live at /en /es /lang) (e.g if params includes home, fetch /en otherwise fetch /es)
port media manager
localization collection in tina
content needs to be en/* and es/*
media manager
port auth 
traverse the tree to localize all non fully  qualified urls to prepend with locale code. 
try generateStaticParams on content
TEST BUILD HERE

Home page collection: (scratch)
Edit "page collectio template?" (e.g, template of max-width 85ch and own template) 
Default Row of (270px) autofit? or md:grid?
Add menu to collections
TEST BUILD HERE
other tina config (partials? skip)
Do footer

localization gha
note that we can use fs + next remote markdown for remote markdown
SW to replace tina markdown if needed?
*/
