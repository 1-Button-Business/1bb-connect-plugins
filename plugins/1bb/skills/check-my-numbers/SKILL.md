---
name: check-my-numbers
description: This skill should be used when a member of 1BB asks "how are my posts doing", "check my numbers", "which post did best", "show my analytics", "how many views did I get", or wants to know what to post more of. Requires the 1BB Connect tools.
---

# Check my numbers

Show the member how their posts are doing and one thing to do more of.

## Ground rules

1. **Check the connection first.** Call `onebb_connection_status` before anything else. If it fails, stop and tell the member to reconnect in 1BB Settings, then Connect your AI.
2. **Never ask for the key in chat.** If the member pastes a key, do not use it. Tell them to revoke it in 1BB and make a new one.
3. Never invent a number. A blank number means the platform has not reported it yet, never zero.
4. Numbers refresh a few times a day. Say so if the member expects live numbers.
5. **Never claim** a post went out unless its status says published.

## Workflow

1. Call `onebb_list_posts` (follow `next_cursor` for more if they ask about a longer time).
2. Show a small table: date, platform, the first few words, views, likes, comments, shares.
3. Name the best post and why it may have worked (the hook, the topic, the photo).
4. Give one idea: "Want me to write another post like that one?" If yes, follow `post-everywhere`.
5. For the full charts, give them `analytics_url`.

## Flag missing info

- No posts yet: say so and offer to write the first one (see `post-everywhere`).
- All numbers blank: the platforms have not reported yet. Check again later today.

## 1BB data used

End with a short "1BB data used" line: which posts you read and when their numbers last refreshed.
