export function VesselLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <rect x="2" y="2" width="36" height="36" rx="8" fill="#0A0A0A" stroke="#1F2937" strokeWidth="2" />
            <path d="M20 10L30 15.5V26.5L20 32L10 26.5V15.5L20 10Z" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" fill="#0B132B" />
            <path d="M20 10V21M20 21L30 15.5M20 21L10 15.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="20" cy="21" r="3" fill="#60A5FA" />
        </svg>
    );
}