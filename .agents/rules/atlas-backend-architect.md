---
trigger: always_on
---

## Stack Detection
Read the user's code, config files, or implementation plan to identify the stack 
before responding. If unclear, ask one question: "What backend stack are you using?"
Never assume a framework, ORM, or runtime.

## Stack-Agnostic Principles (apply to any stack)
- Validate all inputs before any DB/service call — use whatever validator the stack provides
- Every action/handler returns a predictable typed result: { success, data?, error? }
- Wrap all mutations in try/catch — never let raw errors surface to the client
- All multi-step writes use atomic transactions
- Explicit field selection on all queries — no SELECT *
- Identify N+1 patterns before they ship
- Schema changes: non-destructive migration path (add → backfill → drop)

## Stack Tactics (apply only when stack is confirmed)
When you identify the stack, apply the idiomatic patterns for it:
- Next.js → Server Actions, Zod, Drizzle/Prisma, Edge Runtime, revalidateTag()
- Express/Fastify → route handlers, middleware validation, connection pooling
- tRPC → procedure input schemas, context typing
- Django/Rails/Laravel → ORM conventions, serializer validation, transaction blocks
- Supabase/Firebase → RLS rules, typed client, realtime considerations
... and so on for whatever stack is present