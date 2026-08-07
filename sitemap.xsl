<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml">
    <xsl:output method="html" encoding="UTF-8" indent="yes"/>

    <xsl:template match="/">
        <html lang="en">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <title>KIBU Games Sitemap</title>
            <style>
                body {
                    margin: 0;
                    padding: 28px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    background: #f8fafc;
                    color: #172033;
                }
                h1 { margin: 0 0 6px; font-size: 28px; }
                p { margin: 0 0 22px; color: #64748b; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: #fff;
                    border: 1px solid #dbe3ef;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
                }
                th, td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #edf2f7;
                    text-align: left;
                    vertical-align: top;
                    font-size: 14px;
                }
                th {
                    background: #eef4ff;
                    color: #26364f;
                    font-weight: 700;
                    white-space: nowrap;
                }
                tr:last-child td { border-bottom: none; }
                a { color: #2563eb; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .url { word-break: break-all; }
                .num { font-weight: 700; color: #0f172a; }
            </style>
        </head>
        <body>
            <h1>KIBU Games Sitemap</h1>
            <p><span class="num"><xsl:value-of select="count(s:urlset/s:url)"/></span> URLs available for search engines.</p>
            <table>
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Last Modified</th>
                        <th>Change Frequency</th>
                        <th>Priority</th>
                    </tr>
                </thead>
                <tbody>
                    <xsl:for-each select="s:urlset/s:url">
                        <tr>
                            <td class="url">
                                <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                            </td>
                            <td><xsl:value-of select="s:lastmod"/></td>
                            <td><xsl:value-of select="s:changefreq"/></td>
                            <td><xsl:value-of select="s:priority"/></td>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
