interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  uploading?: boolean;
}

export default function UserAvatar({
  name,
  avatarUrl,
  className = "h-16 w-16 text-lg",
  uploading = false,
}: UserAvatarProps) {
  const initial = (name || "U").charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-md ring-2 ring-indigo-500/20 ${className}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${name} avatar`}
          className={`h-full w-full object-cover ${uploading ? "opacity-60" : ""}`}
        />
      ) : (
        initial
      )}
    </div>
  );
}
