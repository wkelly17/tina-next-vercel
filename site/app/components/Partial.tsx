// import {useEffect, useState} from "react";
// import {TMarkDown} from "./TinaMarkDown";
// import client from "@/tina/__generated__/client";
// // import {dbConnection} from "@lib/databaseConnection";

// type PartialProps = {
//   referencedPartial: any;
// };
// export function Partial(props: PartialProps) {
//   const [content, setContent] = useState(null);

//   useEffect(() => {
//     async function getReferencedContent() {
//       // todo: deos the client exist here? try it

//       if (!props.referencedPartial) return;
//       let halved = props.referencedPartial.split("src/content/");
//       if (!halved[1]) return;
//       const response = await client.queries.partials({
//         relativePath: halved[1],
//       });
//       if (response && response.data?.partials?.content) {
//         setContent(response.data?.partials?.content);
//       }
//     }

//     getReferencedContent();
//   }, [props.referencedPartial]);

//   return <>{content && <TMarkDown content={content} />}</>;
// }
