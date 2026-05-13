---
Task ID: 1
Agent: main
Task: Fix UUID Generator and JSON Formatter tool loading errors

Work Log:
- Diagnosed error: `render_uuid-generator` not found after loading script
- Root cause: uuid-generator.js and json-formatter.js registered global functions with underscores (`render_uuid_generator`, `render_json_formatter`) but app.js looks for `window["render_" + toolId]` where toolId contains hyphens
- mac-frame.js was already correctly using bracket notation: `window['render_mac-frame']`
- Fixed uuid-generator.js: changed `window.render_uuid_generator = ...` to `window['render_uuid-generator'] = render_uuid_generator;`
- Fixed json-formatter.js: changed `window.render_json_formatter = ...` to `window['render_json-formatter'] = render_json_formatter;`
- Verified ToolStorage (js/storage.js) is loaded in index.html before app.js - OK
- Verified MiniDevTools global helper (showToast, copyToClipboard) is defined inline in index.html - OK
- Verified css/tools/json-formatter.css exists with syntax highlighting styles - OK

Stage Summary:
- Both tools now register with correct bracket notation matching toolId convention
- All three working tools (uuid-generator, json-formatter, mac-frame) consistently use `window['render_' + toolId]` pattern
- No other changes needed
