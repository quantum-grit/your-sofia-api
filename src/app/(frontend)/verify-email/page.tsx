import { getServerSideURL } from '@/utilities/getURL'

interface Props {
  searchParams: Promise<{ token?: string }>
}

type VerificationState = 'missing' | 'invalid' | 'error' | 'success'

function renderMessage(state: VerificationState) {
  const baseStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  }

  const messages: Record<VerificationState, { title: string; description: string }> = {
    missing: {
      title: 'Грешна връзка за потвърждение',
      description:
        'Липсва валиден код за потвърждение. Моля, проверете връзката от имейла и опитайте отново.',
    },
    invalid: {
      title: 'Грешна връзка за потвърждение',
      description:
        'Връзката за потвърждение не е валидна или е изтекла. Моля, поискайте нов имейл за потвърждение.',
    },
    error: {
      title: 'Грешна връзка за потвърждение',
      description: 'Имаше проблем при проверката на връзката. Моля, опитайте отново по-късно.',
    },
    success: {
      title: 'Успешно потвърдихте имейла си',
      description: 'Акаунтът ви е активиран и можете да се логнете през мобилното приложение.',
    },
  }

  const message = messages[state]

  return (
    <div style={baseStyle}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>{message.title}</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6 }}>{message.description}</p>
      </div>
    </div>
  )
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams
  let state: VerificationState = token ? 'success' : 'missing'

  if (token) {
    try {
      const res = await fetch(`${getServerSideURL()}/api/users/verify/${token}`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!res.ok) {
        state = 'invalid'
      }
    } catch {
      state = 'error'
    }
  }

  return renderMessage(state)
}
