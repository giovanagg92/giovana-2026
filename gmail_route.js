import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { google } from "googleapis"

const LABEL_MAP = {
  USINES: ["BRILLANT", "PELINTEX", "VST", "ONE PARIS COUTURE", "MAROCCAN MANUFACTORY", "ARTAN", "CABILUX"],
  TISSUS: ["ECOPEL", "YUNSA", "RIOPELE", "FANTAISIE TRICOT", "AZIENDA FODERAMI DRAGONI", "CANGIOLI", "MANTECO", "FITECOM", "BERTINI", "FOX BROTHERS", "TEXMODATESSUTI", "TITANUS", "BIANCO TESSUTI", "CERVOTESSILE", "JESSGROVE"],
  TRIMS: ["FREUDENBERG", "CFB", "MYZIP", "EPAU NOVA", "CLOSE TO CLOTHES", "SARL SR FOURNITURES", "STELLAE"],
  ENTREPOT: ["ENTREPOT"],
  TEAM: ["TEAM"],
}

function getOAuthClient(accessToken) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({ access_token: accessToken })
  return auth
}

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get("folder") || "ALL"
  const days = searchParams.get("days") || "7"
  const threadId = searchParams.get("threadId")

  const auth = getOAuthClient(session.accessToken)
  const gmail = google.gmail({ version: "v1", auth })

  // Get single thread detail
  if (threadId) {
    const thread = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
      format: "full",
    })
    return Response.json(thread.data)
  }

  // Build search query
  let query = `in:inbox newer_than:${days}d`
  if (folder !== "ALL") {
    const suppliers = LABEL_MAP[folder] || []
    if (suppliers.length > 0) {
      const fromQuery = suppliers.map(s => `from:${s.toLowerCase()}`).join(" OR ")
      query += ` (${fromQuery})`
    }
  }

  const threads = await gmail.users.threads.list({
    userId: "me",
    q: query,
    maxResults: 50,
  })

  if (!threads.data.threads?.length) {
    return Response.json({ threads: [], total: 0 })
  }

  // Fetch thread details in parallel (limit to 20)
  const threadDetails = await Promise.all(
    (threads.data.threads || []).slice(0, 20).map(t =>
      gmail.users.threads.get({
        userId: "me",
        id: t.id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      }).then(r => r.data)
    )
  )

  const result = threadDetails.map(thread => {
    const msg = thread.messages?.[0]
    const headers = msg?.payload?.headers || []
    const get = (name) => headers.find(h => h.name === name)?.value || ""
    const snippet = thread.messages?.[thread.messages.length - 1]?.snippet || ""

    return {
      id: thread.id,
      subject: get("Subject"),
      from: get("From"),
      date: get("Date"),
      snippet: snippet.substring(0, 200),
      messageCount: thread.messages?.length || 1,
    }
  })

  return Response.json({ threads: result, total: result.length })
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json()
  const { action, to, subject, message, threadId, draftId } = body

  const auth = getOAuthClient(session.accessToken)
  const gmail = google.gmail({ version: "v1", auth })

  // Create email RFC 2822
  const createRaw = (to, subject, body, replyToThreadId) => {
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      body,
    ].join("\n")
    return Buffer.from(email).toString("base64url")
  }

  if (action === "draft") {
    const raw = createRaw(to, subject, message)
    const draft = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw,
          ...(threadId ? { threadId } : {}),
        },
      },
    })
    return Response.json({ success: true, draftId: draft.data.id })
  }

  if (action === "send") {
    const raw = createRaw(to, subject, message)
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
        ...(threadId ? { threadId } : {}),
      },
    })
    return Response.json({ success: true })
  }

  if (action === "label") {
    const { labelIds, addLabelIds, removeLabelIds } = body
    await gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      requestBody: {
        addLabelIds: addLabelIds || [],
        removeLabelIds: removeLabelIds || [],
      },
    })
    return Response.json({ success: true })
  }

  return Response.json({ error: "Action inconnue" }, { status: 400 })
}
