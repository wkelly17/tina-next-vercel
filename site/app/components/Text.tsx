type boxProps = {
  children: any;
  as: string;
  class: string;
};
export function Text(props: boxProps) {
  let asToUse = props.as ? props.as : "p";
  const Tag = `${asToUse}` as keyof JSX.IntrinsicElements;
  return (
    <>
      <Tag className={`${props.class}`}>{props.children}</Tag>
    </>
  );
}
