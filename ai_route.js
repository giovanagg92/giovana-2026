import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const TFS_CONTEXT = `Tu es l'assistant production de The Frankie Shop (TFS), marque de mode parisienne.
Fournisseurs connus: BRILLANT, PELINTEX, VST, ONE PARIS COUTURE, ECOPEL, YUNSA, RIOPELE, FANTAISIE TRICOT, AZIENDA FODERAMI DRAGONI, JESSGROVE, MYZIP, STELLAE, FREUDENBERG, CFB, CANGIOLI, MANTECO, FITECOM, BERTINI, FOX BROTHERS, TEXMODATESSUTI, TITANUS, ECOPEL, BIANCO TESSUTI, CERVOTESSILE, EPAU NOVA, CLOSE TO CLOTHES.
Capsules: C26.3HS, C26.4, C26.4ESS, C26.4ACC, C26.5, C26.5ACC, REORDER, FW26TFS, FW26MILAN.
Catégories: USINES (factories), TISSUS (fabrics/linings), TRIMS (fournitures), ENTREPOT, TEAM.
Format sujet email TFS: "TFS / CAPSULE / FOURNISSEUR / USINE"`

export async function POST(request) {
  const body = await request.json()
  const { action, emails, emailContent, emailType, supplier, capsule, context } = body

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  // ANALYZE INBOX - batch analysis
  if (action === "analyze_inbox") {
    const prompt = `${TFS_CONTEXT}

Analyse ces emails et retourne UNIQUEMENT un JSON valide (pas de markdown, pas de backticks):
{
  "summary": "résumé global 100 chars max",
  "emails": [
    {
      "id": "id de l'email",
      "priority": "urgent|important|info",
      "priority_reason": "raison 50 chars max",
      "supplier": "fournisseur détecté ou null",
      "capsule": "capsule ou null",
      "category": "USINES|TISSUS|TRIMS|ENTREPOT|TEAM|autre",
      "action_required": true,
      "action": "action requise 80 chars max ou null",
      "summary": "résumé email 100 chars max"
    }
  ],
  "relances_needed": ["fournisseur1"],
  "stats": {"urgent": 0, "important": 0, "info": 0, "total": 0}
}

Règles priorité:
- urgent: ETD dépassé, problème qualité, retard critique, annulation
- important: confirmation commande, ETD dans 2 semaines, développement coloris
- info: accusé réception, information générale, facture

Emails à analyser:
${JSON.stringify(emails.map(e => ({ id: e.id, subject: e.subject, from: e.from, snippet: e.snippet })))}

Réponds UNIQUEMENT avec le JSON.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return Response.json({ error: "JSON invalide" }, { status: 500 })
    
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return Response.json(parsed)
    } catch {
      return Response.json({ error: "Parse error" }, { status: 500 })
    }
  }

  // SUMMARIZE single email
  if (action === "summarize") {
    const prompt = `${TFS_CONTEXT}

Résume cet email de fournisseur en JSON:
{
  "summary": "résumé clair 150 chars max",
  "key_points": ["point 1", "point 2"],
  "action": "action requise ou null",
  "etd": "date ETD mentionnée ou null",
  "quantities": "quantités mentionnées ou null",
  "references": "références articles mentionnées ou null"
}

Email:
${emailContent}

UNIQUEMENT le JSON.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    try {
      return Response.json(JSON.parse(jsonMatch[0]))
    } catch {
      return Response.json({ summary: text, key_points: [], action: null })
    }
  }

  // DRAFT email
  if (action === "draft") {
    const templates = {
      commande: `Rédige un email de commande TFS professionnel au fournisseur ${supplier}.`,
      relance: `Rédige un email de relance TFS poli mais ferme au fournisseur ${supplier}. Demande une mise à jour sur l'avancement.`,
      etd: `Rédige un email TFS demandant confirmation de l'ETD au fournisseur ${supplier}.`,
      urgence: `Rédige un email urgent TFS au fournisseur ${supplier}. Ton direct, situation critique.`,
      facturation: `Rédige un email de transmission de facture au format TFS compta.
Format corps: "Bonjour, factures de [FOURNISSEUR] : Facture [N°] / [TFS ONLY ou TFS+WHOLESALE] / N° compte 60110000 / ENTITE PARIS. Merci. Bien à vous,"
Destinataire: ap@thefrankieshop.com, CC: mathilde@thefrankieshop.com
Objet: FACTURE PRODUCTION / [FOURNISSEUR]`,
    }

    const prompt = `${TFS_CONTEXT}

${templates[emailType] || templates.relance}
Capsule concernée: ${capsule || "non précisée"}
Contexte supplémentaire: ${context || "aucun"}

Format sujet: TFS / ${capsule || "CAPSULE"} / ${supplier || "FOURNISSEUR"} / USINE
Langue: français (anglais si fournisseur étranger: RIOPELE=portugais/anglais, YUNSA=anglais, ECOPEL=anglais)
Ton: professionnel TFS, direct et concis.

Retourne JSON:
{
  "subject": "sujet email",
  "body": "corps email complet",
  "to": "email fournisseur si connu sinon null",
  "language": "fr|en"
}

UNIQUEMENT le JSON.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    try {
      return Response.json(JSON.parse(jsonMatch[0]))
    } catch {
      return Response.json({ subject: "", body: text, to: null, language: "fr" })
    }
  }

  // DETECT RELANCES needed
  if (action === "detect_relances") {
    const prompt = `${TFS_CONTEXT}

Analyse ces emails et identifie quels fournisseurs nécessitent une relance urgente.
Critères: pas de réponse depuis >5 jours, ETD non confirmé, commande sans accusé de réception.

Emails: ${JSON.stringify(emails.map(e => ({ subject: e.subject, from: e.from, date: e.date, snippet: e.snippet })))}

Retourne JSON:
{
  "relances": [
    {
      "supplier": "nom fournisseur",
      "reason": "raison relance",
      "urgency": "haute|moyenne|faible",
      "suggested_subject": "sujet email relance"
    }
  ]
}

UNIQUEMENT le JSON.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    try {
      return Response.json(JSON.parse(jsonMatch[0]))
    } catch {
      return Response.json({ relances: [] })
    }
  }

  return Response.json({ error: "Action inconnue" }, { status: 400 })
}
