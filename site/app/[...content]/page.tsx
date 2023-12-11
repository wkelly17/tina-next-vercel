import {PageServer} from "@/app/components/PageServer";
import {client} from "@/tina/__generated__/databaseClient";
import {PageQuery} from "@/tina/__generated__/types";
import {prefixInternalLinksWithLangCode} from "@/utils/localizeLinks";
import * as fs from "node:fs/promises";
import path from "node:path";

export async function generateStaticParams() {
  const currentDir = process.cwd();
  const contentDir = `${currentDir}/content`;

  const pages = await fs.readdir(contentDir, {
    encoding: "utf-8",
    recursive: true,
    withFileTypes: false,
  });
  let slugs = [];
  for (const entry of pages) {
    if (!entry.includes("pages/")) continue;
    const parsed = path.parse(entry);
    let fileName = `${parsed.dir}/${parsed.name}`;
    if (parsed.name == "home") {
      fileName = fileName.split("/")[0]; //the locale /en /es
    }
    slugs.push({
      content: [fileName],
    });
  }
  return slugs;
}

// todo: eliminate any
export default async function Page({params}: any) {
  // console.log({props});
  const {content} = params;
  let relativePath = content.join("/") + ".mdx";
  if (Array.isArray(content) && content.length == 1) {
    relativePath = `${content[0].replaceAll("/", "")}/pages/home.mdx`; // fetch home, but url segment is chopped to just be /localeCode
  }
  const parts = relativePath.split("/");
  const localeCode = parts[0];
  console.log({content});
  const res = await client.queries.page({relativePath: relativePath});
  const data = JSON.parse(JSON.stringify(res.data)) as PageQuery;
  // mutates
  prefixInternalLinksWithLangCode(data.page.body, localeCode);
  return (
    <div>
      <div>
        <PageServer data={data} query={res.query} variables={res.variables} />
      </div>
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

localization gha
note that we can use fs + next remote markdown for remote markdown
SW to replace tina markdown if needed?
*/
