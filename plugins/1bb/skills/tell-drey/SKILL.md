---
name: tell-drey
description: This skill should be used when a member of 1BB says "this isn't working", "send this to Drey", "report a bug", "I have an idea for 1BB", "tell 1BB", or when a 1BB Connect tool fails or the member is unhappy with how 1BB works. Requires the 1BB Connect tools.
---

# Tell Drey

Send the member's feedback straight to Drey, so problems get fixed fast.

## Ground rules

1. **Check the connection first.** Call `onebb_connection_status` before anything else. If it fails, stop and tell the member to reconnect in 1BB Settings, then Connect your AI.
2. **Never ask for the key in chat.** If the member pastes a key, do not use it. Tell them to revoke it in 1BB and make a new one.
3. Offer this whenever a 1BB tool fails or the member sounds stuck: "Want me to send this to Drey?"
4. Use the member's own words. Add what you were doing and the error text, in one or two plain sentences.
5. Never include passwords, keys, card numbers or private client details.
6. **Never claim** a fix happened. Sending feedback is not a fix.

## Workflow

1. Ask what kind it is if it is not clear: something not working (bug), an idea, or a question.
2. Show the note you will send and ask "Send it?"
3. Call `onebb_send_feedback` with `kind`, `message`, and `about` (the tool or step, for example "photo upload").
4. Tell the member: "Sent to Drey. Thank you for telling us."
5. For "how does this work" questions, answer with `onebb_help` first; offer to send it to Drey only if that does not answer it.

## Flag missing info

- The member's message is unclear: ask one question (what were you trying to do?) before sending.

## 1BB data used

End with a short "1BB data used" line: the note you sent and its feedback_id.
