AMHARIC FONT FOR PDF EXPORT (number 10)
=====================================
To export lessons as PDF with Amharic text, put these files in THIS folder (server/src/fonts/):

    NotoSansEthiopic-Regular.ttf
    NotoSansEthiopic-Bold.ttf        (optional: without it, bold text uses the regular font)

Where to get them (free, SIL Open Font License, allowed in this app):
    https://fonts.google.com/noto/specimen/Noto+Sans+Ethiopic   -> "Get font" / "Download all"
    If the download has a variable font file (NotoSansEthiopic[wdth,wght].ttf) rename a static copy to the names above.

Without the font, "HTML" export still works; PDF export shows a clear message asking for the font.
Commit the .ttf file(s) to GitHub together with the code so Render deploys them.
