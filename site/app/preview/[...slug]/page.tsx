import {client} from "@/tina/__generated__/databaseClient";
import {PageClient} from "@/app/components/PageClient";

//  todo: eliminate any
export default async function PreviewPage({params}: any) {
  let relativePath = params.slug.join("/") + ".mdx";
  if (params.slug.length == 1) {
    relativePath = `${params.slug[0].replaceAll("/", "")}/pages/home.mdx`; // fetch home, but url segment is chopped to just be /localeCod
  }
  const res = await client.queries.page({relativePath: relativePath});

  return (
    <PageClient
      data={JSON.parse(JSON.stringify(res.data))}
      query={res.query}
      variables={res.variables}
    />
  );
}
