import re
import markdown

def convert_markdown_to_html(markdown_text: str) -> str:
    """
    Converts Markdown study notes into styled HTML with custom callout boxes,
    formatted tables, MathJax formulas, and Mermaid diagram containers.
    """
    # 1. Protect LaTeX inline formulas from markdown processing
    formula_store = []

    def stash_formula(m):
        idx = len(formula_store)
        formula_store.append(m.group(0))
        return f"FORMULA_STASH_{idx}_END"

    protected = re.sub(r'\\\(.*?\\\)', stash_formula, markdown_text, flags=re.DOTALL)
    protected = re.sub(r'\\\[.*?\\\]', stash_formula, protected, flags=re.DOTALL)

    # 2. Convert standard Markdown to HTML
    html = markdown.markdown(
        protected,
        extensions=[
            "tables",
            "fenced_code",
            "toc",
            "sane_lists"
        ]
    )

    # 3. Restore stashed LaTeX formulas
    for idx, formula in enumerate(formula_store):
        html = html.replace(f"FORMULA_STASH_{idx}_END", formula)

    # 4. Convert paragraphs starting with emojis into structured subheaders or callouts
    html = re.sub(
        r"<p>(📘|❓|📌|💡|🧠|⚡|🎯|💼|🔁|📐|🌍|✅|❌|📊|⚠️|📂|📝|⭐|🚀|🔍|🎓|💻|🗂|⚙️|🍕|⚖️|🔥)(.*?)</p>",
        r"<h3>\1\2</h3>",
        html
    )

    # 5. Transform specific h3 section headings into styled callout containers
    callout_mappings = [
        (r'<h3>(🧠\s*In Simple Words.*?)</h3>', r'<div class="callout-box definition-box"><h3>\1</h3>'),
        (r'<h3>(💡\s*Real-Life Analogy.*?)</h3>', r'<div class="callout-box analogy-box"><h3>\1</h3>'),
        (r'<h3>(💡\s*Real-Life Example.*?)</h3>', r'<div class="callout-box analogy-box"><h3>\1</h3>'),
        (r'<h3>(⚠️\s*Common Mistakes.*?)</h3>', r'<div class="callout-box warning-box"><h3>\1</h3>'),
        (r'<h3>(⚠️\s*Common Misconceptions.*?)</h3>', r'<div class="callout-box warning-box"><h3>\1</h3>'),
        (r'<h3>(⭐\s*Exam Tip.*?)</h3>', r'<div class="callout-box exam-focus-box"><h3>\1</h3>'),
        (r'<h3>(🎯\s*Exam Focus.*?)</h3>', r'<div class="callout-box exam-questions-box"><h3>\1</h3>'),
        (r'<h3>(🔥\s*Key Takeaways.*?)</h3>', r'<div class="callout-box revision-box"><h3>\1</h3>'),
    ]

    for pattern, replacement in callout_mappings:
        html = re.sub(pattern, replacement, html, flags=re.IGNORECASE)

    # 6. Wrap mermaid codeblocks into div.mermaid for client rendering
    html = re.sub(
        r'<pre><code class="(?:language-)?mermaid">(.*?)</code></pre>',
        r'<div class="mermaid-container"><div class="mermaid">\1</div></div>',
        html,
        flags=re.DOTALL
    )

    # 7. Wrap tables with 4+ columns in a wide-table container for better layout
    def wrap_wide_table(m):
        table_html = m.group(0)
        col_count = len(re.findall(r'<th', table_html))
        if col_count >= 4:
            return f'<div class="wide-table">{table_html}</div>'
        return table_html

    html = re.sub(r'<table>.*?</table>', wrap_wide_table, html, flags=re.DOTALL)

    # 8. Clean up unescaped html entities in mermaid diagrams
    html = html.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")

    return html
