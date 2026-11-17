# ethanchristianflint.github.io

Personal site of Ethan Christian Flint: https://ethanchristianflint.github.io

- Built with [Eleventy](https://www.11ty.dev/); plain HTML and CSS, no client-side JavaScript.
- Target: WCAG 2.2 AA, plus selected AAA criteria (7:1 contrast, enhanced focus).
- Every push to `main` builds the site, runs axe-core and a 320px reflow check on every page (`npm test`), and deploys to GitHub Pages only if they pass.

## Local

```sh
npm ci
npm start      # dev server
npm run build  # outputs _site/
npm test       # accessibility checks against _site/ (needs Chrome; set CHROME_PATH if not /usr/bin/google-chrome)
```

## Adding content

- Learning log entry: `src/log/YYYY-MM-DD-slug.md` with `title` and `date` front matter.
- Article: `src/articles/YYYY-MM-DD-slug.md` with `title` and `date` front matter.
