interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizes = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
};

export function Logo({ className = "", size = "md", showTagline = false }: LogoProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`font-semibold tracking-tight ${sizes[size]}`}>
        <span className="text-accent">12</span>
        <span className="text-foreground">Stones</span>
      </div>
      {showTagline && (
        <p className="text-foreground-muted text-sm mt-1">
          Memorials to be shared
        </p>
      )}
    </div>
  );
}
