const letters =
  "M0 2H205L180 38H0ZM0 80H153L128 116H37V186H0ZM572 2L547 38H466A19 19 0 0 0 466 76H523A55 55 0 0 1 523 186H440L418 150H523A19 19 0 0 0 523 112H466A55 55 0 0 1 466 2ZM612 2H649V76H731V2H768V186H731V112H649V186H612ZM780 2H828L889 64L950 2H998L908 98V186H870V98ZM1003 2H1016L1133 95V2H1170V186L1040 65V186H1003Z";
const chevron = "M158 186L288 0L418 186H372L288 64L204 186Z";

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
