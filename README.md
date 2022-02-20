# Cloudflare RSS Bridge

Cloudflare Worker that creates an RSS feed from any website using CSS selectors.

## Example

```html
<div class="articles">
  <h1>Articles</h1>

  <div class="article-item">
    <a href="/batman-beats-the-joker">
      <h2>Batman beats the Joker</h2>
    </a>
    <div class="desc">Last night in Gotham City</div>
    <div class="when">12 February 2022</div>
  </div>

  <div class="article-item">
    <a href="/batman-beats-the-joker">
      <h2>Oscorp invents new formula</h2>
    </a>
    <div class="desc">
      CEO Norman Osborn says it's going to be a game changer
    </div>
    <div class="when">11 February 2022</div>
  </div>

  ...
</div>
```

The following URL would create an RSS feed from the HTML above

`https://rss.account.worker.dev/?url=http%3A%2F%2Fexample.org&item=.article-item&title=h2&description=.desc&link=a&pubDate=.when`

## URL generator

```js
function generateURL(host, item, title, description, link, pubDate) {
  const url = new URL("https://rss.account.worker.dev");

  url.searchParams.set("url", host);
  url.searchParams.set("item", item);
  url.searchParams.set("title", title);
  url.searchParams.set("description", description);
  url.searchParams.set("link", link);
  url.searchParams.set("pubDate", pubDate);

  return url.toString();
}

generateURL("http://example.org", ".article-item", "h2", ".desc", "a", ".when");
```

## Note

This is a simple implementation and there are many edge cases where this will fail.
