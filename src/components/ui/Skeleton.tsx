export default function Skeleton({
  height = 16,
  width = '100%',
  radius = 10,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return (
    <div
      className="yp-skeleton"
      style={{ height, width, borderRadius: radius }}
      aria-hidden
    />
  );
}
