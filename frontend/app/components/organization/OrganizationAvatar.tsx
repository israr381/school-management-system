interface OrganizationAvatarProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
}

function orgInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function OrganizationAvatar({
  name,
  logoUrl,
  className = "h-10 w-10 rounded-xl text-sm",
}: OrganizationAvatarProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={`shrink-0 object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-bold text-white ${className}`}
      style={{
        background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
      }}
    >
      {orgInitials(name)}
    </div>
  );
}
