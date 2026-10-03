import { useSyncExternalStore, type AnchorHTMLAttributes } from "react";
const subscribe = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};
const pathname = () =>
  window.location.hash.startsWith("#/")
    ? window.location.hash.slice(1).split("?")[0]
    : "/";
export const usePathname = () =>
  useSyncExternalStore(subscribe, pathname, () => "/");
const router = {
  push(path: string) {
    window.location.hash = path;
    window.scrollTo(0, 0);
  },
};
export const useRouter = () => router;
export function Link({
  href = "/",
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const internal = href.startsWith("/");
  return (
    <a
      {...props}
      href={internal ? "#" + href : href}
      onClick={(e) => {
        onClick?.(e);
        if (
          internal &&
          !e.defaultPrevented &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey &&
          e.button === 0
        ) {
          e.preventDefault();
          router.push(href);
        }
      }}
    />
  );
}
