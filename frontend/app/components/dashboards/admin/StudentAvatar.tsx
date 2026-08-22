import { useState } from "react";

interface StudentAvatarProps {
  name: string;
  avatar?: string | null;
  rank: number;
}

const rankBadgeStyles: Record<number, string> = {
  1: "bg-amber-400 text-white ring-2 ring-amber-200",
  2: "bg-slate-400 text-white ring-2 ring-slate-200",
  3: "bg-orange-400 text-white ring-2 ring-orange-200",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function StudentAvatar({ name, avatar, rank }: StudentAvatarProps) {
  const [failed, setFailed] = useState(!avatar);

  return (
    <div className="relative shrink-0">
      {failed ? (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-border-main/60"
          style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}
        >
          {initials(name)}
        </div>
      ) : (
        <img
          src={avatar || ""}
          alt={name}
          onError={() => setFailed(true)}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-border-main/60"
        />
      )}
      {rank <= 3 && (
        <span
          className={`absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${rankBadgeStyles[rank]}`}
        >
          {rank}
        </span>
      )}
    </div>
  );
}
