type AppLogoProps = {
  className?: string;
  title?: string;
};

export default function AppLogo({ className = "h-6 w-6", title = "Dashboard logo" }: AppLogoProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" role="img" aria-label={title}>
      <path
        d="M24 4 41.3 14v20L24 44 6.7 34V14L24 4Z"
        fill="currentColor"
        className="text-slate-950"
      />
      <path
        d="M24 5.8 39.8 15v18L24 42.2 8.2 33V15L24 5.8Z"
        fill="url(#app-logo-panel)"
        stroke="rgba(255,255,255,.38)"
        strokeWidth="1.4"
      />
      <path
        d="M15 31.5 21 24.5l5.2 4.5L33.5 17"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="31.5" r="3" fill="#34D399" stroke="white" strokeWidth="1.5" />
      <circle cx="21" cy="24.5" r="3" fill="#60A5FA" stroke="white" strokeWidth="1.5" />
      <circle cx="26.2" cy="29" r="3" fill="#A78BFA" stroke="white" strokeWidth="1.5" />
      <circle cx="33.5" cy="17" r="3" fill="#22D3EE" stroke="white" strokeWidth="1.5" />
      <path
        d="M14 14.5h10M14 18.5h6"
        stroke="rgba(255,255,255,.72)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="app-logo-panel" x1="9" x2="40" y1="8" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06B6D4" />
          <stop offset=".48" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}
