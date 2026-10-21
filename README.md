# Boyi Fu — Academic Website

Personal academic website: https://boyifu-ai.github.io/

Built with Jekyll and the Folio Academic design. The site includes a bilingual profile, research and publications, news, contact information, and the existing visitor map.

## Local preview

Install Ruby and Bundler, then run:

```sh
bundle install
bundle exec jekyll serve
```

## Content

- `index.html`: homepage
- `AboutMe.md`: English/Chinese profile, education, experience, awards, service
- `research.html`: research overview and bilingual motto
- `_data/publications.yml`: publications shared by the homepage and Research
- `_posts/`: news articles with their existing URLs
- `Contact.html`: contact information and address
- `assets/site.css`: responsive styling
- `images/awesome-boyi.jpg`: portrait

## Deployment

GitHub Pages builds the website from the repository's `master` branch. Local screenshots, build output, logs, and preview tooling are not included in the publication commit.

The visitor map uses the existing Cloudflare service, with a dated snapshot fallback. Visitor-map page views and approximate city locations are recorded automatically, independently of optional Google Analytics. No raw IP addresses are stored in the map database. Localhost previews do not record visits. The `visitor-telemetry-worker` directory retains the existing service source and is excluded from the website build.
