interface AccessRestrictedProps {
  title?: string;
  description: string;
}

export default function AccessRestricted({
  title = "Access restricted",
  description,
}: AccessRestrictedProps) {
  return (
    <div className="w-full">
      <div className="dashboard-card flex flex-col items-center px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-text-main">{title}</h2>
        <p className="mt-2 text-sm text-text-muted">{description}</p>
      </div>
    </div>
  );
}
