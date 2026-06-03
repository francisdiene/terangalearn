const ANTHROPIC_KEY = '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'

async function test() {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: 'Dis bonjour en français'
      }]
    })
  })

  const data = await response.json()
  console.log('Status:', response.status)
  console.log('Réponse complète:', JSON.stringify(data, null, 2))
}

test()