// Builds the area landing pages (/bengaluru/, /mumbai/, ...) from the finished index.html.
// Each page is the same app shell - same bundle, same map - with its own head tags, a
// visible list of the area's streams, and the area's bounds for the map to open on. The
// bundle's file names are hashed, so these are made at build time, from the built page,
// by the seo plugin in vite.config.ts.

const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// Matches one head tag by the attribute that identifies it and swaps its content value.
const setMeta = (html, attr, key, value) =>
  html.replace(new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`), (_, a, b) => `${a}${esc(value)}${b}`);

const riverLink = (r) => `<a href="#river-${r.uid}">${esc(r.name)}</a>`;

function describe(r) {
  const parts = [];
  if (r.len) parts.push(`${r.len < 10 ? r.len : Math.round(r.len)} km`);
  if (r.from && r.to) parts.push(`${esc(r.from)} to ${esc(r.to)}`);
  if (r.into) parts.push(`${r.kind === "sea" ? "mouth into" : "joins"} ${esc(r.into)}`);
  return parts.length ? ` – ${parts.join("; ")}` : "";
}

function areaGuide(area, data, byUid) {
  const nearby = Object.entries(data.places)
    .map(([place, uids]) => {
      const names = uids.slice(0, 5).map((u) => byUid.get(u)).filter(Boolean);
      return names.length ? `<li><strong>${esc(place)}</strong>: ${names.map(riverLink).join(", ")}</li>` : "";
    })
    .join("");
  return `<details class="guide guide-open" open>
      <summary>Rivers and streams of ${esc(area.name)}</summary>
      <h1>Rivers and streams of ${esc(area.name)} (${esc(area.alt)}) – map</h1>
      <p>${esc(area.intro)}</p>
      ${nearby ? `<h2>Streams near ${esc(area.name)} neighbourhoods</h2><ul>${nearby}</ul>` : ""}
      <h2>All ${data.rivers.length} rivers and streams on the map</h2>
      <ul>${data.rivers.map((r) => `<li>${riverLink(r)}${describe(r)}</li>`).join("")}</ul>
      <p><a href="__BASE__">See the rivers of all India on the map</a></p>
    </details>`;
}

export function areaPages({ html, areas, rivers, site, base }) {
  return areas.map((area) => {
    const data = rivers[area.slug];
    const byUid = new Map(data.rivers.map((r) => [r.uid, r]));
    const url = `${site}/${area.slug}/`;
    const title = `Rivers and Streams of ${area.name} (${area.alt}) – Map`;
    const names = data.rivers.slice(0, 4).map((r) => r.name).join(", ");
    const description = `Map of the ${data.rivers.length} rivers and streams of ${area.name}, including ${names}. See where each starts, where it ends and what it flows into.`;
    const [w, s, e, n] = area.bbox;
    const jsonld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${url}#page`,
          name: title,
          url,
          inLanguage: "en-IN",
          description,
          isPartOf: { "@id": `${site}/#website` },
          about: { "@type": "Place", name: area.name },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: data.rivers.length,
            itemListElement: data.rivers.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name })),
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Rivers of India", item: `${site}/` },
            { "@type": "ListItem", position: 2, name: area.name, item: url },
          ],
        },
      ],
    };

    let page = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(jsonld).replaceAll("<", "\\u003c")}</script>`)
      .replace(/<details class="guide">[\s\S]*?<\/details>/, areaGuide(area, data, byUid).replaceAll("__BASE__", base))
      .replace("<body>", `<body data-bbox="${[w, s, e, n].join(",")}">`);
    page = setMeta(page, "name", "description", description);
    page = setMeta(page, "property", "og:title", title);
    page = setMeta(page, "property", "og:description", description);
    page = setMeta(page, "property", "og:url", url);
    page = setMeta(page, "name", "twitter:title", title);
    page = setMeta(page, "name", "twitter:description", description);
    return { fileName: `${area.slug}/index.html`, source: page };
  });
}

// The home page's collapsed guide: the intro plus a link to every area page.
export function homeLinks(areas, base) {
  return areas
    .map((a) => `<li><a href="${base}${a.slug}/">Rivers and streams of ${esc(a.name)} (${esc(a.alt)})</a></li>`)
    .join("");
}
