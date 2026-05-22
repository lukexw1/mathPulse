/** TabBar — bottom navigation with 5 tabs (Dashboard, Practice, Calculator, Theory, Profile). */

import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

export function TabBar() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("tabbar.label")}
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-14 px-6 tabbar-fade"
      style={{ paddingBottom: "var(--safe-area-bottom, 0px)" }}
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-12 min-h-12 transition-colors active:scale-[0.97] duration-[var(--duration-fast)] ${
            isActive
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon name="dashboard" filled={isActive} size={36} />
            <span className="hidden md:block font-body text-xs uppercase tracking-widest mt-1">
              {t("tabbar.dashboard")}
            </span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/practice"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-12 min-h-12 transition-colors active:scale-[0.97] duration-[var(--duration-fast)] ${
            isActive
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon name="bolt" filled={isActive} size={36} />
            <span className="hidden md:block font-body text-xs uppercase tracking-widest mt-1">
              {t("tabbar.practice")}
            </span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/calculator"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-12 min-h-12 transition-colors active:scale-[0.97] duration-[var(--duration-fast)] ${
            isActive
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon name="calculate" filled={isActive} size={36} />
            <span className="hidden md:block font-body text-xs uppercase tracking-widest mt-1">
              {t("tabbar.calculator")}
            </span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/theory"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-12 min-h-12 transition-colors active:scale-[0.97] duration-[var(--duration-fast)] ${
            isActive
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon name="school" filled={isActive} size={36} />
            <span className="hidden md:block font-body text-xs uppercase tracking-widest mt-1">
              {t("tabbar.theory")}
            </span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-12 min-h-12 transition-colors active:scale-[0.97] duration-[var(--duration-fast)] ${
            isActive
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon name="person" filled={isActive} size={36} />
            <span className="hidden md:block font-body text-xs uppercase tracking-widest mt-1">
              {t("tabbar.profile")}
            </span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
