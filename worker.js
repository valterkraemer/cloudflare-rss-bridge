addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

function escape(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function handleRequest(request) {
  const { searchParams, href } = new URL(request.url);

  const targetUrl = new URL(searchParams.get("url"));

  const itemSelector = searchParams.get("item");
  const titleSelector = searchParams.get("title");
  const descriptionSelector = searchParams.get("description");
  const linkSelector = searchParams.get("link");
  const pubDateSelector = searchParams.get("pubDate");

  const items = [];
  let item;
  let title = "";
  let description = "";

  const res = await fetch(targetUrl);

  await new HTMLRewriter()
    .on("head title", {
      text(text) {
        title += text.text;
      },
    })
    .on('head meta[name="description"]', {
      text(text) {
        description += text.text;
      },
    })
    .on(itemSelector, {
      element() {
        item = {
          title: "",
          description: "",
          link: "",
          pubDate: "",
        };
        items.push(item);
      },
    })
    .on(`${itemSelector} ${titleSelector}`, {
      text(text) {
        item.title += text.text;
      },
    })
    .on(`${itemSelector} ${descriptionSelector}`, {
      text(text) {
        item.description += text.text;
      },
    })
    .on(`${itemSelector} ${linkSelector}`, {
      element(element) {
        item.link = element.getAttribute("href");

        // Make links absolute
        if (item.link?.startsWith("/")) {
          item.link = `${targetUrl.origin}${item.link}`;
        }
      },
    })
    .on(`${itemSelector} ${pubDateSelector}`, {
      text(text) {
        item.pubDate += text.text;

        if (text.lastInTextNode && item.pubDate) {
          item.pubDate = new Date(item.pubDate).toUTCString();
        }
      },
    })
    .transform(res)
    .arrayBuffer();

  const lastBuildDate = (
    items.map((item) => new Date(item.pubDate)).sort((a, b) => b - a)[0] ||
    new Date()
  ).toUTCString();

  const rss = `
<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  version="2.0">

  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${targetUrl}</link>
    <atom:link href="${escape(href)}" rel="alternate" type="application/rss+xml" />
    <generator>vkrae-rss-generator</generator>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    ${items
      .map(
        (item) => `
    <item>
      <title><![CDATA[${item.title.trim()}]]></title>
      <description><![CDATA[${item.description.trim()}]]></description>
      <link>${item.link.trim()}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <pubDate>${item.pubDate}</pubDate>
    </item>`
      )
      .join("\n")}
  </channel>
</rss>
  `.trim();

  return new Response(rss, {
    headers: new Headers({
      "Content-Type": "text/xml",
      charset: "utf-8",
    }),
  });
}
