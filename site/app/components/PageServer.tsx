import {PageQuery} from "@/tina/__generated__/types";
import Image from "next/image";
import {TMarkDown} from "./TinaMarkdown";

// import { tinaField, useTina } from "tinacms/dist/react";

export function PageServer(props: {
  data: PageQuery;
  variables: object;
  query: string;
}) {
  // const { data } = useTina(props);
  const data = props.data;
  return (
    <div className="contentWrap min-h-screen">
      {/* {!props.isHomePage && <PageTitle title={data.page.title} />} */}
      {data?.page?.body ? (
        <TMarkDown content={data.page?.body} />
      ) : (
        "FETCH FAILED"
      )}
    </div>
  );
}
