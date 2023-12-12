"use client";
import {PartialsQuery} from "@/tina/__generated__/types";
import {TMarkDown} from "../TinaMarkdown";
import {tinaField, useTina} from "tinacms/dist/react";

// import { tinaField, useTina } from "tinacms/dist/react";

export function Footer(props: {
  data: PartialsQuery;
  variables: object;
  query: string;
}) {
  const {data} = useTina(props);
  return (
    <footer className="" data-tina-field={tinaField(data, "partials")}>
      {data?.partials.content && <TMarkDown content={data.partials.content} />}
    </footer>
  );
}
