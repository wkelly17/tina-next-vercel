import {TMarkDown} from "./TinaMarkdown";

type GridProps = {
  colMinWidth: number;
  colMaxSize: number;
  class: string;
  children: any;
};
export function Grid(props: GridProps) {
  return (
    <>
      <div
        className={`grid grid-cols-[repeat(auto-fit,_minmax(${props.colMinWidth}px,1fr))]  ${props.class}`}
      >
        <TMarkDown content={props.children} />
      </div>
    </>
  );
}
