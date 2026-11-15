import { createClient } from '@/lib/supabase/server'

export type AiFeature = 'coach' | 'exam' | 'correction' | 'resume' | 'exercise' | 'bulletin'

interface AiCallParams {
  userId:     string | null
  feature:    AiFeature
  model:      string
  tokensIn:   number
  tokensOut:  number
  durationMs: number
  success:    boolean
  errorCode?: string
}

/**
 * Enregistre un appel Groq dans ai_logs (fire-and-forget, ne bloque pas la réponse)
 */
export async function logAiCall(params: AiCallParams): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('ai_logs').insert({
      user_id:     params.userId ?? null,
      feature:     params.feature,
      model:       params.model,
      tokens_in:   params.tokensIn,
      tokens_out:  params.tokensOut,
      duration_ms: params.durationMs,
      success:     params.success,
      error_code:  params.errorCode ?? null,
    })
  } catch {
    // Ne jamais faire crasher la route principale à cause du log
  }
}
