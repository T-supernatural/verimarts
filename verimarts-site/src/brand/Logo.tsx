/** The wordmark, letter by letter, in a shared 1170 x 188 coordinate space. */
export const letterShapes = [
  { key: "F", x: 0, width: 205, d: "M0 2H205L180 38H0ZM0 80H153L128 116H37V186H0Z" },
  { key: "A", x: 158, width: 260, d: "M158 186L288 0L418 186H372L288 64L204 186Z" },
  { key: "S", x: 418, width: 160, d: "M572 2L547 38H466A19 19 0 0 0 466 76H523A55 55 0 0 1 523 186H440L418 150H523A19 19 0 0 0 523 112H466A55 55 0 0 1 466 2Z" },
  { key: "H", x: 612, width: 156, d: "M612 2H649V76H731V2H768V186H731V112H649V186H612Z" },
  { key: "Y", x: 780, width: 218, d: "M780 2H828L889 64L950 2H998L908 98V186H870V98Z" },
  { key: "N", x: 1003, width: 167, d: "M1003 2H1016L1133 95V2H1170V186L1040 65V186H1003Z" },
];
const chevron = letterShapes[1].d;
const letters = letterShapes
  .filter((letter) => letter.key !== "A")
  .map((letter) => letter.d)
  .join("");

/** Vector FASHYN wordmark. Letters follow currentColor; the A chevron follows --logo-accent. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={`logo${className ? ` ${className}` : ""}`}
      viewBox="0 0 1170 188"
      role="img"
      aria-label="FASHYN"
    >
      <path fill="currentColor" d={letters} />
      <path className="logo__accent" d={chevron} />
    </svg>
  );
}
