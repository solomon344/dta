interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

// Material Symbols glyph. Glyph names must also be listed in ICON_NAMES in app/layout.tsx.
export default function Icon({ name, className = "", filled = false }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${filled ? "icon-filled" : ""} ${className}`}
    >
      {name}
    </span>
  );
}
