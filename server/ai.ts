import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'

// The Claude step. It gets the computed metrics (already final, it must not
// change them) and the text of the latest 10-K, and returns the prose for each
// slide plus the facts that only exist as text in the filing: customer
// concentration, segment and region mix, floating-rate share, and legal
// proceedings. The API key is read from ANTHROPIC_API_KEY on the server only.

export const MODEL = 'claude-opus-5-5'

const Share = z.object({ label: z.string(), percent: z.number() })

export const AiOutput = z.object({
  takeaways: z.array(z.string()).describe('Exactly 5 takeaways, each one sentence of at most 18 words (under 110 characters) for a credit analyst, most important first.'),
  leverageSummary: z.string(),
  fccrSummary: z.string(),
  debtSummary: z.string(),
  exposureSummary: z.string(),
  floatingRateSharePercent: z
    .number()
    .nullable()
    .describe('Percent of total debt at floating or variable rates, from the debt footnote or Item 7A. null if not disclosed.'),
  largestCustomerSharePercent: z
    .number()
    .nullable()
    .describe('Percent of revenue from the largest customer. null if the 10-K does not give a figure.'),
  top3CustomerSharePercent: z
    .number()
    .nullable()
    .describe('Percent of revenue from the three largest customers combined. null if not disclosed.'),
  segments: z.array(Share).describe('Revenue share by reportable segment for the latest fiscal year, at most 5 rows, summing to about 100.'),
  regions: z.array(Share).describe('Revenue share by geography for the latest fiscal year, at most 5 rows, summing to about 100.'),
  reputation: z.object({
    level: z.enum(['Low', 'Medium', 'High']),
    summary: z.string(),
    events: z
      .array(
        z.object({
          date: z.string().describe('Month and year, e.g. "Mar 2026", or "FY2025 10-K" if undated.'),
          tag: z.enum(['Litigation', 'Regulatory', 'Leadership', 'Legal', 'Financial', 'Other']),
          headline: z.string().describe('Under 90 characters.'),
        }),
      )
      .describe('At most 4 items, most significant first.'),
  }),
})

export type AiOutput = z.infer<typeof AiOutput>

const SYSTEM = `You write the text for a credit first-look deck that a JP Morgan analyst will present.

You receive (1) metrics computed from the company's SEC XBRL data, with covenant pass/watch/fail statuses, and (2) the full text of the company's latest 10-K.

Rules:
- The computed metrics are final. Quote them exactly as given; never recompute or contradict them.
- Take every other fact from the 10-K text only. If the 10-K does not state something, return null (or an empty list) rather than estimating.
- Summaries are one or two plain sentences (under 45 words) that explain what drives the number and what to watch. No hedging filler, no markdown.
- Reputation comes from Item 3 Legal Proceedings and the contingencies note: rate Low when nothing material is pending, Medium for notable but non-material matters, High for matters the company calls material, government enforcement, or going-concern doubt. Note that no news search was done.`

export async function writeNarrative(input: { company: string; metrics: unknown; tenK: string }): Promise<AiOutput> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Set ANTHROPIC_API_KEY on the server to generate summaries.')
  }
  const client = new Anthropic()
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(AiOutput) },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'text', media_type: 'text/plain', data: input.tenK },
            title: `${input.company} latest 10-K`,
            // Regenerating the same company within a few minutes reuses the cached filing.
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `Company: ${input.company}\n\nComputed metrics (JSON):\n${JSON.stringify(input.metrics, null, 2)}`,
          },
        ],
      },
    ],
  })
  if (response.stop_reason === 'refusal') throw new Error('Claude declined to summarize this filing.')
  if (!response.parsed_output) throw new Error(`Claude returned no usable output (stop reason: ${response.stop_reason}).`)
  return response.parsed_output
}
