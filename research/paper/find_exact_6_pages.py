import re
import sys
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent

# We will import build_outputs and test different CSS configurations
import build_outputs

def test_config(font_size, line_height, p_margin, h1_margin, h2_margin, fig_margin, narrow_max_width, page_margin, table_margin):
    # build html with custom css
    css = f"""
    @page {{ size: A4; margin: {page_margin}; }}
    body {{ font-family: 'Times New Roman', Georgia, serif; font-size: {font_size}; line-height: {line_height};
           color:#111; }}
    .title {{ font-size: 16pt; font-weight: bold; text-align:center; margin: 0 0 5pt; line-height:1.2; }}
    .authors {{ display: flex; justify-content: center; gap: 8mm; margin: 4pt 0 8pt; }}
    .author-cell {{ flex: 0 1 33%; text-align: center; }}
    .author-cell .an {{ font-size: 10pt; font-weight: bold; margin-bottom: 2pt; }}
    .author-cell .ad {{ font-size: 8.5pt; line-height: 1.25; color: #222; }}
    .abstract-label, .kw-label {{ font-weight: bold; font-style: italic; }}
    .abs2 {{ column-count: 2; column-gap: 6mm; margin: 3pt 0 4pt; }}
    .abs2 .abstract {{ text-align: justify; margin: 0; }}
    .keywords {{ text-align: justify; margin: 0 0 6pt; font-size: {font_size}; line-height: {line_height}; }}
    .cols {{ column-count: 2; column-gap: 6mm; }}
    h1 {{ font-size: 9.8pt; text-transform: uppercase; text-align:center; margin: {h1_margin}; }}
    h2 {{ font-size: 9.3pt; font-style: italic; margin: {h2_margin}; }}
    p  {{ text-align: justify; margin: {p_margin}; }}
    figure {{ break-inside: avoid; margin: {fig_margin}; text-align:center; }}
    figure.wide {{ column-span: all; margin: 6pt 0; }}
    figure img {{ width: 100%; border: 0.5pt solid #999; }}
    figure.wide img {{ max-height: 180px; width: auto; max-width: 98%; }}
    figure.narrow img {{ max-width: {narrow_max_width}; }}
    figcaption {{ font-size: 8pt; text-align: justify; margin-top: 2pt; line-height: 1.2; }}
    table {{ border-collapse: collapse; width: 100%; font-size: 7.9pt; margin: {table_margin};
            break-inside: avoid; }}
    caption {{ caption-side: top; font-size: 8pt; font-weight: bold; text-align:left;
              margin-bottom: 2pt; }}
    th, td {{ border-top: 0.7pt solid #222; border-bottom: 0.7pt solid #222; padding: 2pt 3.5pt;
             text-align: left; vertical-align: top; }}
    th {{ border-bottom: 1pt solid #000; }}
    tr:last-child td {{ border-bottom: 1pt solid #000; }}
    .refs {{ column-count: 2; column-gap: 6mm; font-size: 7.8pt; line-height: 1.25; }}
    .refs ol {{ margin: 0; padding-left: 1.3em; }}
    .refs li {{ margin-bottom: 2.5pt; text-align: justify; }}
    """
    
    # Generate html using build_outputs components
    parts = [f"<style>{css}</style>"]
    parts.append(f'<div class="title">{build_outputs.TITLE}</div>')
    author_cells = ""
    for a in build_outputs.AUTHORS:
        author_cells += (
            '<div class="author-cell">'
            f'<div class="an">{a["name"]}</div>'
            f'<div class="ad">{build_outputs.DEPT}</div>'
            f'<div class="ad">ABES Engineering College</div>'
            f'<div class="ad">{build_outputs.CITY}</div>'
            f'<div class="ad">{a["email"]}</div>'
            f'<div class="ad">Roll No.: {a["roll"]}</div>'
            '</div>'
        )
    parts.append(f'<div class="authors">{author_cells}</div>')
    parts.append('<div class="abs2"><p class="abstract">'
                 f'<span class="abstract-label">Abstract&mdash;</span>{build_outputs.ABSTRACT}</p></div>')
    parts.append('<p class="keywords">'
                 f'<span class="kw-label">Index Terms&mdash;</span>{build_outputs.KEYWORDS}.</p>')
    parts.append('<div class="cols">')
    for kind, payload in build_outputs.BODY:
        if kind == "h1":
            parts.append(f"<h1>{payload}</h1>")
        elif kind == "h2":
            parts.append(f"<h2>{payload}</h2>")
        elif kind == "p":
            parts.append(f"<p>{payload}</p>")
        elif kind == "fig":
            path, cap, label = payload
            fp = build_outputs.FIGDIR / path
            wide = "wide" if label == "1" else "narrow"
            parts.append(f'<figure class="{wide}"><img src="{build_outputs._img_data_uri(fp)}"/>'
                         f'<figcaption><b>Fig. {label}.</b> {cap}</figcaption></figure>')
        elif kind == "table":
            cap, headers, rows, label = payload
            th = "".join(f"<th>{h}</th>" for h in headers)
            trs = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
            parts.append(f'<table><caption>{cap}</caption><thead><tr>{th}</tr></thead>'
                         f'<tbody>{trs}</tbody></table>')
    parts.append("</div>")  # end cols
    parts.append('<h1>References</h1><div class="refs"><ol>')
    for r in build_outputs.REFERENCES:
        parts.append(f"<li>{r}</li>")
    parts.append("</ol></div>")
    html_content = "<!doctype html><html><head><meta charset='utf-8'></head><body>" + "".join(parts) + "</body></html>"

    out_pdf = HERE / "test_out.pdf"
    tmp_html = HERE / "_test_render.html"
    tmp_html.write_text(html_content, encoding="utf-8")
    worker = f"""
import sys, asyncio
if sys.platform == 'win32':
    try: asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception: pass
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(headless=True)
    pg = b.new_page()
    pg.goto({repr(tmp_html.as_uri())}, wait_until='networkidle')
    pg.wait_for_timeout(600)
    pg.pdf(path={repr(str(out_pdf))}, format='A4', print_background=True,
           margin={{'top':'0','bottom':'0','left':'0','right':'0'}})
    b.close()
"""
    subprocess.run([sys.executable, "-c", worker], check=True)
    tmp_html.unlink(missing_ok=True)
    pages = len(re.findall(rb'/Type\s*/Page\b', out_pdf.read_bytes()))
    print(f"Tested font={font_size}, line_height={line_height}, narrow_max_width={narrow_max_width}, page_margin={page_margin} -> Pages: {pages}")
    return pages

if __name__ == "__main__":
    # Test a few subtle variations
    configs = [
        ("9.3pt", "1.24", "0 0 3.5pt", "8pt 0 2.5pt", "6pt 0 2pt", "4pt 0", "78%", "14mm 13mm", "3pt 0 4pt"),
        ("9.4pt", "1.26", "0 0 3.8pt", "9pt 0 3pt", "6.5pt 0 2.5pt", "5pt 0", "80%", "14mm 13mm", "3pt 0 5pt"),
        ("9.5pt", "1.28", "0 0 4pt", "10pt 0 3pt", "7pt 0 2.5pt", "6pt 0", "82%", "15mm 13mm", "3pt 0 6pt"),
    ]
    for c in configs:
        p = test_config(*c)
