import re
import sys

files = [
    "api/src/routes/legacy/chat.ts",
    "api/src/routes/v1/admin/index.ts",
    "api/src/routes/v1/auth/index.ts",
    "api/src/routes/v1/config.ts",
    "api/src/routes/v1/couple/chat/ack.ts",
    "api/src/routes/v1/couple/chat/file-downloaded.ts",
    "api/src/routes/v1/couple/chat/purge.ts",
    "api/src/routes/v1/couple/index.ts",
    "api/src/routes/v1/devices.ts",
    "api/src/routes/v1/finance/index.ts",
    "api/src/routes/v1/health/index.ts",
    "api/src/routes/v1/user/index.ts",
]

def depth_prefix(match_str):
    count = match_str.count("../")
    return "../" * (count - 1)

replacements = [
    (r'from "(\.\./)+db/schema\.js"', lambda m: f'from "{depth_prefix(m.group(0))}shared/schema.js"'),
    (r'from "(\.\./)+db/index\.js"',  lambda m: f'from "{depth_prefix(m.group(0))}shared/db.js"'),
    (r'from "(\.\./)+app/_services/chat/message-purge\.js"', lambda m: f'from "{depth_prefix(m.group(0))}shared/message-purge.js"'),
    (r'from "(\.\./)+app/_services/chat/push-service\.js"',  lambda m: f'from "{depth_prefix(m.group(0))}shared/chat-push.js"'),
    (r'from "(\.\./)+app/_services/finance/couple/core\.js"', lambda m: f'from "{depth_prefix(m.group(0))}shared/couple-membership.js"'),
    (r'from "(\.\./)+app/_services/finance/couple-service\.js"', lambda m: f'from "{depth_prefix(m.group(0))}shared/couple-membership.js"'),
]

for filepath in files:
    try:
        content = open(filepath).read()
        for pattern, repl in replacements:
            content = re.sub(pattern, repl, content)
        open(filepath, "w").write(content)
        print(f"Fixed: {filepath}")
    except Exception as e:
        print(f"Error in {filepath}: {e}")
