<?xml version="1.0" encoding="UTF-8"?>
<!--
  Human-readable rendering of /sitemap.xml.

  Referenced by the <?xml-stylesheet?> instruction that app/sitemap.xml/route.ts
  writes above the root element. Browsers apply it and show the page below;
  crawlers skip processing instructions entirely, so Googlebot still sees plain
  <urlset> XML. Nothing here affects indexing — it is purely so a person opening
  the sitemap sees something legible.

  XSLT 1.0 is the only version browsers implement, so: no date functions (dates
  are trimmed with substring()), no external CSS (styles are inlined below), and
  no webfonts — next/font is not in play on this document, so the stack is the
  system one. Colours are copied from app/globals.css; they are duplicated
  rather than imported because this file is served straight from public/ and
  never passes through Tailwind.
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="s">

  <xsl:output method="html" encoding="UTF-8" indent="yes"
    doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <!-- The sitemap is for crawlers; this rendering of it is not worth indexing. -->
        <meta name="robots" content="noindex, follow"/>
        <title>XML Sitemap · Shani Travels</title>
        <style>
          :root {
            --navy: #0b2447;
            --navy-light: #163a6b;
            --navy-deep: #071a37;
            --blue-light: #2f6fbf;
            --accent: #c8102e;
            --offwhite: #f6f7f9;
            --band: #eef1f5;
            --line: #e2e7ee;
            --ink: #0e1b2e;
            --muted: #5b6b82;
          }

          * { box-sizing: border-box; }

          body {
            margin: 0;
            background: var(--offwhite);
            color: var(--ink);
            font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            line-height: 1.5;
          }

          .masthead {
            background: linear-gradient(160deg, var(--navy) 0%, var(--navy-deep) 100%);
            color: #ffffff;
            padding: 40px 24px 44px;
            border-bottom: 3px solid var(--accent);
          }

          .masthead-inner { max-width: 1100px; margin: 0 auto; }

          .eyebrow {
            font-size: 11px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #9db4d4;
            margin: 0 0 10px;
            font-weight: 600;
          }

          h1 {
            font-family: "Poppins", system-ui, -apple-system, "Segoe UI", sans-serif;
            font-size: 30px;
            line-height: 1.15;
            letter-spacing: -0.02em;
            font-weight: 700;
            margin: 0 0 10px;
          }

          .lede {
            margin: 0;
            max-width: 620px;
            color: #c3d3e8;
            font-size: 14px;
          }

          .stats { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }

          .stat {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 8px;
            padding: 9px 14px;
            font-size: 13px;
            color: #dce7f5;
          }

          .stat strong { color: #ffffff; font-weight: 600; }

          main { max-width: 1100px; margin: 0 auto; padding: 28px 24px 64px; }

          .card {
            background: #ffffff;
            border: 1px solid var(--line);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(11, 36, 71, 0.04),
                        0 8px 24px -12px rgba(11, 36, 71, 0.18);
          }

          table { width: 100%; border-collapse: collapse; font-size: 14px; }

          thead th {
            background: var(--band);
            color: var(--navy);
            text-align: left;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-weight: 700;
            padding: 12px 16px;
            border-bottom: 1px solid var(--line);
            white-space: nowrap;
          }

          tbody td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--line);
            vertical-align: middle;
          }

          tbody tr:last-child td { border-bottom: 0; }
          tbody tr:nth-child(even) { background: #fafbfc; }
          tbody tr:hover { background: #f2f6fb; }

          .idx {
            color: var(--muted);
            font-variant-numeric: tabular-nums;
            width: 48px;
            font-size: 13px;
          }

          a.loc {
            color: var(--navy);
            text-decoration: none;
            font-weight: 600;
            word-break: break-word;
          }

          a.loc:hover { color: var(--blue-light); text-decoration: underline; }

          .freq {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.03em;
            text-transform: capitalize;
            background: var(--band);
            color: var(--muted);
            border: 1px solid var(--line);
          }

          .freq-weekly { background: #e8f1fd; color: #1e4d8c; border-color: #cfe0f6; }
          .freq-monthly { background: #eef1f5; color: #46586f; border-color: #dde3ec; }
          .freq-yearly { background: #f4f1ee; color: #7a6a58; border-color: #e8e0d6; }

          .prio { display: flex; align-items: center; gap: 10px; min-width: 110px; }

          .bar {
            flex: 1;
            height: 5px;
            background: var(--band);
            border-radius: 999px;
            overflow: hidden;
            min-width: 56px;
          }

          .bar-fill {
            display: block;
            height: 100%;
            background: linear-gradient(90deg, var(--blue-light), var(--navy));
            border-radius: 999px;
          }

          .prio-num {
            font-variant-numeric: tabular-nums;
            color: var(--muted);
            font-size: 12px;
            width: 26px;
          }

          .date {
            color: var(--muted);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
            font-size: 13px;
          }

          .footnote {
            margin: 20px 2px 0;
            color: var(--muted);
            font-size: 12.5px;
            line-height: 1.6;
          }

          .footnote a { color: var(--blue-light); }

          @media (max-width: 720px) {
            .masthead { padding: 28px 18px 32px; }
            h1 { font-size: 23px; }
            main { padding: 20px 14px 48px; }
            thead th, tbody td { padding: 10px 12px; }
            .col-freq, .col-prio, .idx { display: none; }
          }
        </style>
      </head>

      <body>
        <xsl:variable name="urls" select="/s:urlset/s:url"/>

        <div class="masthead">
          <div class="masthead-inner">
            <p class="eyebrow">Shani Travels</p>
            <h1>XML Sitemap</h1>
            <p class="lede">
              Every page on this site that is offered to search engines for
              indexing. This is the styled view — the file itself is standard
              sitemap XML.
            </p>
            <div class="stats">
              <span class="stat">
                <strong><xsl:value-of select="count($urls)"/></strong> URLs
              </span>
              <span class="stat">
                Domain
                <strong>
                  <xsl:value-of select="substring-before(substring-after($urls[1]/s:loc, '//'), '/')"/>
                </strong>
              </span>
              <span class="stat">
                Updated
                <strong><xsl:value-of select="substring($urls[1]/s:lastmod, 1, 10)"/></strong>
              </span>
            </div>
          </div>
        </div>

        <main>
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th class="idx">#</th>
                  <th>Page</th>
                  <th class="col-prio">Priority</th>
                  <th class="col-freq">Frequency</th>
                  <th>Last modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="$urls">
                  <tr>
                    <td class="idx"><xsl:value-of select="position()"/></td>
                    <td>
                      <a class="loc" href="{s:loc}">
                        <!-- Strip scheme and host: the domain is already in the
                             masthead, and the path is the part worth scanning. -->
                        <xsl:value-of select="concat('/', substring-after(substring-after(s:loc, '//'), '/'))"/>
                      </a>
                    </td>
                    <td class="col-prio">
                      <div class="prio">
                        <span class="bar">
                          <span class="bar-fill" style="width: {format-number(s:priority * 100, '0')}%"/>
                        </span>
                        <span class="prio-num"><xsl:value-of select="s:priority"/></span>
                      </div>
                    </td>
                    <td class="col-freq">
                      <span class="freq freq-{s:changefreq}">
                        <xsl:value-of select="s:changefreq"/>
                      </span>
                    </td>
                    <td class="date"><xsl:value-of select="substring(s:lastmod, 1, 10)"/></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <p class="footnote">
            Priority and change frequency describe this site's own structure —
            they are hints, which search engines weigh at their discretion.
            Submit this file's address in
            <a href="https://search.google.com/search-console">Google Search Console</a>.
          </p>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
