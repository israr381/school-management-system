import { BookOpen, MessagesSquare } from "lucide-react";
import logoDark from "./logo-dark.svg";
import logoLight from "./logo-light.svg";

export function Welcome() {
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <div className="w-125 max-w-[100vw] p-4">
            <img
              src={logoLight}
              alt="React Router"
              className="theme-logo-light"
            />
            <img
              src={logoDark}
              alt="React Router"
              className="theme-logo-dark"
            />
          </div>
        </header>
        <div className="max-w-75 w-full space-y-6 px-4">
          <nav className="rounded-3xl border border-border-main p-6 space-y-4">
            <p className="leading-6 text-text-muted text-center">
              What&apos;s next?
            </p>
            <ul>
              {resources.map(({ href, text, icon }) => (
                <li key={href}>
                  <a
                    className="group flex items-center gap-3 self-stretch p-3 leading-normal text-link hover:underline"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {icon}
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}

const resources = [
  {
    href: "https://reactrouter.com/docs",
    text: "React Router Docs",
    icon: (
      <BookOpen className="w-6 h-5 stroke-text-muted group-hover:stroke-current" />
    ),
  },
  {
    href: "https://rmx.as/discord",
    text: "Join Discord",
    icon: (
      <MessagesSquare className="w-6 h-5 stroke-text-muted group-hover:stroke-current" />
    ),
  },
];
