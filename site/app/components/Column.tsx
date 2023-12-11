import {TMarkDown} from "./TinaMarkdown";

type ColProps = {
  children: any;
  class: string;
};
export function Column(props: ColProps) {
  return (
    <>
      <div className={`${props.class}`}>
        <TMarkDown content={props.children} />
      </div>
    </>
  );
}
