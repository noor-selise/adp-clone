type BrandMarkProps = {
  className?: string
}

export const BrandMark = ({ className = 'h-8 w-8' }: BrandMarkProps) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M7 7v18h18"
      className="stroke-current"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="13.2" cy="13" r="3.1" className="fill-current" />
    <path
      d="M8.4 24.8c.3-3.5 2.4-5.5 4.8-5.5s4.5 2 4.8 5.5"
      className="fill-current"
    />
    <circle cx="20.6" cy="14.2" r="2.7" className="fill-current opacity-90" />
    <path
      d="M16.4 24.8c.3-2.9 2.1-4.6 4.2-4.6s4 1.7 4.2 4.6"
      className="fill-current opacity-90"
    />
  </svg>
)
