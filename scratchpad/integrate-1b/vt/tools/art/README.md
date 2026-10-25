# Art tools

`gemini_gen.py MODEL OUT.png PROMPT_FILE [REFERENCE ...] [--aspect 1:1]` makes one image with the Gemini API
and writes a JSON record beside it (prompt, model, references, usage, date). The key is not read by the script:
the cloud environment's network secret attaches it to requests for `generativelanguage.googleapis.com`.
Run it with Python 3; it needs no packages. Prompts follow the art prompt pack (`docs/design/war-table.md`,
"Art prompt pack"); portrait prompts add a per-face description of the person and their kit so a set does not
repeat the anchor.
