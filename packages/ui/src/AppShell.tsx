import type { ReactNode } from "react";
import { NAV_ITEMS } from "./nav.js";

type AppShellProps = {
  brand: string;
  pathname: string;
  children: ReactNode;
};

export function AppShell({ brand, pathname, children }: AppShellProps) {
  return (
    <div className="vf-shell">
      <a className="vf-skip" href="#main">
        Skip to content
      </a>
      <header className="vf-top">
        <p className="vf-brand">{brand}</p>
      </header>
      <div className="vf-body">
        <nav className="vf-nav" aria-label="Primary">
          <ul className="vf-nav__list">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={active ? "vf-nav__link vf-nav__link--active" : "vf-nav__link"}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <main id="main" className="vf-main">
          {children}
        </main>
      </div>
    </div>
  );
}
