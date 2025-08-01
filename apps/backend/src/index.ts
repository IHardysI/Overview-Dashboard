import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";

const Conversation = t.Object({
  last_message: t.String(),
  username: t.Union([t.String(), t.Null()]),
  bot_alias: t.String(),
  last_created_at: t.String(),
  project: t.String(),
  conversation_id: t.Number(),
})

const ConversationsResponse = t.Object({
  conversations: t.Array(Conversation),
  total_count: t.Number(),
})

const Message = t.Object({
  is_user_message: t.Boolean(),
  is_bot_message: t.Boolean(),
  created_at: t.String(),
  text: t.String(),
  username: t.Union([t.String(), t.Null()]),
  bot_alias: t.String(),
})

const ChatResponse = t.Object({
  messages: t.Array(Message),
})

const ConversationsByDateResponse = t.Record(t.String(), t.Number())

const Account = t.Object({
  alias: t.String(),
  project: t.String(),
  username: t.String(),
  spam_message: t.Optional(t.String()),
  spam_status: t.Optional(t.String()),
  id: t.String(),
  phone_number: t.String(),
})

const AccountsResponse = t.Object({
  status: t.String(),
  accounts: t.Array(Account),
  total_count: t.Number(),
})

const app = new Elysia()
  .use(cors({
    origin: [
      "http://localhost:3000", 
      "http://0.0.0.0:3000",
      "https://overview-dashboard.dev.reflectai.pro",
      ...(process.env.CORS_ORIGINS?.split(',') || [])
    ],
    credentials: true,
  }))
  .get("/", () => "Hello Elysia")
  .get("/conversations", async ({ query }) => {
    const limit = query.limit ?? 15
    const offset = query.offset ?? 0
    
    const response = await fetch(`https://python-platforma-max-personal.reflectai.pro/coversation/list?limit=${limit}&offset=${offset}`)
    const data = await response.json()
    return data
  }, {
    query: t.Object({
      limit: t.Optional(t.Number()),
      offset: t.Optional(t.Number())
    }),
    response: ConversationsResponse
  })
  .get("/conversations/:id", async ({ params: { id }, query }) => {
    const project = query.project
  
    const url = `https://python-platforma-max-personal.reflectai.pro/coversation/?conversation_id=${id}&project_name=${project}`
    
    const response = await fetch(url)
    const data = await response.json()
    return data
  }, {
    params: t.Object({
      id: t.Number()
    }),
    query: t.Object({
      project: t.String()
    }),
    response: ChatResponse
  })
  .get("/conversations/bydate", async ({ query }) => {
    const start_date = query.start_date
    const end_date = query.end_date
    const response = await fetch(`https://python-platforma-max-personal.reflectai.pro/new_chats?start_date=${start_date}&end_date=${end_date}`)
    const data = await response.json()
    return data
  }, {
    query: t.Object({
      start_date: t.String(),
      end_date: t.String()
    }),
    response: ConversationsByDateResponse
  })
  .get("/accounts", async ({ query }) => {
    const limit = query.limit ?? 15
    const offset = query.offset ?? 0
    const response = await fetch(`https://python-platforma-max-personal.reflectai.pro/get_accounts?limit=${limit}&offset=${offset}`)
    const data = await response.json()
    return data
  }, {
    query: t.Object({
      limit: t.Optional(t.Number()),
      offset: t.Optional(t.Number())
    }),
    response: AccountsResponse
  })
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app

