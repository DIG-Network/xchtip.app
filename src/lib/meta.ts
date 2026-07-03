// meta.ts — per-route document <head> meta for the SPA (title, description, canonical, Open Graph,
// Twitter card). The index.html ships default social tags for the builder; a route that wants its
// OWN social preview (the deterministic tip-jar page — each recipient/asset is a distinct shareable
// page, §6.6 SEO) calls applyMeta to override them, and gets a restore fn to revert on unmount so
// SPA navigation never leaves a stale card.
//
// Pure DOM, no framework: safe to call from a useEffect. Tags are updated in place (idempotent — no
// duplicates), created if absent, and (when created here) removed on restore.

export interface PageMeta {
  /** The document title + og:title + twitter:title. */
  title: string;
  /** The meta description + og:description + twitter:description. */
  description: string;
  /** The canonical URL + og:url (absolute). */
  canonical: string;
  /**
   * OPTIONAL per-page og:image + twitter:image (absolute URL). Omitted → the page's default image
   * (set in index.html, currently the static `og.png`) is left completely untouched — this keeps
   * the door open for a future per-recipient jar OG image (e.g. `/og?recipient=…&scheme=…&logo=…`)
   * without this module hardcoding any assumption about a single site-wide image.
   */
  image?: string;
}

type Revert = () => void;

// Ensure a <meta>/<link> matching `selector` exists; create it (with `attrs`) if not. Returns the
// element plus a revert that restores its prior attribute value, or removes it if we created it.
function ensure(
  selector: string,
  create: () => HTMLElement,
  attr: string,
  value: string,
): Revert {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (el) {
    const prev = el.getAttribute(attr);
    el.setAttribute(attr, value);
    return () => {
      if (prev == null) el!.removeAttribute(attr);
      else el!.setAttribute(attr, prev);
    };
  }
  el = create();
  el.setAttribute(attr, value);
  document.head.appendChild(el);
  const created = el;
  return () => created.remove();
}

function metaByName(name: string): [string, () => HTMLElement] {
  return [
    `meta[name="${name}"]`,
    () => {
      const m = document.createElement("meta");
      m.setAttribute("name", name);
      return m;
    },
  ];
}
function metaByProp(property: string): [string, () => HTMLElement] {
  return [
    `meta[property="${property}"]`,
    () => {
      const m = document.createElement("meta");
      m.setAttribute("property", property);
      return m;
    },
  ];
}

/**
 * applyMeta — set the page's social/SEO meta for the current route and return a revert fn.
 * Title is set directly; description/canonical/OG/Twitter tags are created or updated in place.
 */
export function applyMeta(meta: PageMeta): Revert {
  const reverts: Revert[] = [];

  const prevTitle = document.title;
  document.title = meta.title;
  reverts.push(() => {
    document.title = prevTitle;
  });

  const set = (spec: [string, () => HTMLElement], attr: string, value: string) =>
    reverts.push(ensure(spec[0], spec[1], attr, value));

  set(metaByName("description"), "content", meta.description);
  reverts.push(
    ensure(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      },
      "href",
      meta.canonical,
    ),
  );

  set(metaByProp("og:title"), "content", meta.title);
  set(metaByProp("og:description"), "content", meta.description);
  set(metaByProp("og:url"), "content", meta.canonical);
  set(metaByName("twitter:title"), "content", meta.title);
  set(metaByName("twitter:description"), "content", meta.description);

  // Only touch og:image/twitter:image when a per-page image is explicitly given — otherwise the
  // page keeps whatever default index.html already set (see PageMeta.image doc above).
  if (meta.image) {
    set(metaByProp("og:image"), "content", meta.image);
    set(metaByName("twitter:image"), "content", meta.image);
  }

  return () => {
    // Revert in reverse creation order.
    for (let i = reverts.length - 1; i >= 0; i--) reverts[i]();
  };
}
