export function IconHome({
  selected = false,
  className,
}: {
  selected?: boolean;
  className?: string;
}) {
  if (selected) {
    return (
      <svg className={className} width="23" height="23" viewBox="0 0 24 24" fill="#0A1533">
        <path d="M11.3 2.9a1.1 1.1 0 0 1 1.4 0l8.2 6.9c.3.2.4.5.4.9V20a2 2 0 0 1-2 2h-4.2v-6.1H9v6.1H4.7a2 2 0 0 1-2-2v-9.3c0-.4.1-.7.4-.9z" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(10,21,51,.42)"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="M3.7 10.2 12 3.3l8.3 6.9V20a1.2 1.2 0 0 1-1.2 1.2h-4.4v-6.1H9.3v6.1H4.9A1.2 1.2 0 0 1 3.7 20z" />
    </svg>
  );
}

export function IconBook({
  selected = false,
  className,
}: {
  selected?: boolean;
  className?: string;
}) {
  if (selected) {
    return (
      <svg className={className} width="23" height="23" viewBox="0 0 24 24">
        <rect x="3.2" y="2.6" width="17.6" height="18.8" rx="4.4" fill="#0A1533" />
        <circle cx="12" cy="14" r="4.6" fill="#fff" />
        <circle cx="7.4" cy="6.4" r="1.2" fill="#fff" />
        <circle cx="11.2" cy="6.4" r="1.2" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(10,21,51,.42)"
      strokeWidth="1.8"
    >
      <rect x="3.2" y="2.6" width="17.6" height="18.8" rx="4.4" />
      <circle cx="12" cy="14" r="4.6" />
      <circle cx="7.4" cy="6.4" r=".9" fill="rgba(10,21,51,.42)" stroke="none" />
    </svg>
  );
}

export function IconBookings({
  selected = false,
  className,
}: {
  selected?: boolean;
  className?: string;
}) {
  if (selected) {
    return (
      <svg className={className} width="23" height="23" viewBox="0 0 24 24">
        <rect x="2.8" y="4.4" width="18.4" height="17" rx="4" fill="#0A1533" />
        <rect x="7" y="1.8" width="2" height="4.4" rx="1" fill="#0A1533" />
        <rect x="15" y="1.8" width="2" height="4.4" rx="1" fill="#0A1533" />
        <rect x="2.8" y="9" width="18.4" height="1.6" fill="#fff" opacity=".55" />
        <rect x="6.4" y="13" width="6.4" height="1.8" rx=".9" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(10,21,51,.42)"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <rect x="2.8" y="4.4" width="18.4" height="17" rx="4" />
      <path d="M8 2.6v3.4M16 2.6v3.4M2.8 9.6h18.4" />
    </svg>
  );
}

export function IconProfile({
  selected = false,
  className,
}: {
  selected?: boolean;
  className?: string;
}) {
  if (selected) {
    return (
      <svg className={className} width="23" height="23" viewBox="0 0 24 24" fill="#0A1533">
        <circle cx="12" cy="8" r="4" />
        <path d="M3.9 21c1.3-4 4.4-6.1 8.1-6.1s6.8 2.1 8.1 6.1z" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(10,21,51,.42)"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.6 20.6c1.3-3.8 4.2-5.8 7.4-5.8s6.1 2 7.4 5.8" />
    </svg>
  );
}

export function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="1.9"
      strokeLinecap="round"
    >
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.5 20a2 2 0 0 0 3 0" />
    </svg>
  );
}

export function IconBack({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconMail({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="22"
      viewBox="0 0 32 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <rect x="1.5" y="1.5" width="29" height="19" rx="4" />
      <path d="m3 4 13 9 13-9" />
    </svg>
  );
}

export function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}

/** Disclosure chevron for tappable list rows. */
export function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function IconSwipeArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0A1533"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h13" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconDryerMini({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8A4E05"
      strokeWidth="1.9"
      strokeLinecap="round"
    >
      <path d="M6 13c1.7-2.2 3.6-2.2 5.3 0s3.6 2.2 5.3 0" />
      <path d="M6 17.6c1.7-2.2 3.6-2.2 5.3 0s3.6 2.2 5.3 0" />
      <path d="M12 3.4v5.2" />
    </svg>
  );
}

/** Today tab: a clock — the hour is the unit the product actually books. */
export function IconToday({
  selected = false,
  className,
}: {
  selected?: boolean;
  className?: string;
}) {
  if (selected) {
    return (
      <svg className={className} width="22" height="22" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.4" fill="#0A1533" />
        <path
          d="M12 7.2v5.1l3.4 2"
          fill="none"
          stroke="#fff"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(10,21,51,.42)"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 7.4v4.9l3.3 1.9" />
    </svg>
  );
}
