import {TMarkDown} from "./TinaMarkdown";

type boxProps = {
  children: any;
  class: string;
  bgImage: string;
};
export function Box(props: boxProps) {
  let style: Record<string, string> = {};
  function inlineStyle() {
    if (props.bgImage) {
      style.backgroundImage = `url('${props.bgImage}')`;
    }
    return style;
  }
  return (
    <>
      <div style={inlineStyle()} className={`${props.class}`}>
        <TMarkDown content={props.children} />
      </div>
    </>
  );
}
