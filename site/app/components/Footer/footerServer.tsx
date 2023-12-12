"use client";
import {PartialsQuery} from "@/tina/__generated__/types";
import Image from "next/image";
import {TMarkDown} from "../TinaMarkdown";

// import { tinaField, useTina } from "tinacms/dist/react";

export function Footer(props: {data: PartialsQuery}) {
  const data = props.data;
  return (
    <footer className="">
      {data?.partials.content && <TMarkDown content={data.partials.content} />}
    </footer>
  );
}
