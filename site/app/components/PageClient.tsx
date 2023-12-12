"use client";

import {PageQuery} from "@/tina/__generated__/types";
import Image from "next/image";
import {tinaField, useTina} from "tinacms/dist/react";
import {TMarkDown} from "./TinaMarkdown";
// import { tinaField, useTina } from "tinacms/dist/react";

export function PageClient(props: {
  data: PageQuery;
  variables: object;
  query: string;
}) {
  // const { data } = useTina(props);
  const {data} = useTina(props);

  return (
    <div
      className="contentWrap min-h-screen"
      data-tina-field={tinaField(data, "page")}
    >
      {/* {!props.isHomePage && <PageTitle title={data.page.title} />} */}
      {data?.page?.body ? (
        <TMarkDown content={data.page?.body} />
      ) : (
        "FETCH FAILED"
      )}
    </div>
  );
}
