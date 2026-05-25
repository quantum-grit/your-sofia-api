import { redirect } from 'next/navigation'
import { getServerSideURL } from '@/utilities/getURL'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    redirect('/for-users/faq#registration')
  }

  try {
    const res = await fetch(`${getServerSideURL()}/api/users/verify/${token}`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!res.ok) {
      redirect('/for-users/faq#registration')
    }
  } catch {
    redirect('/for-users/faq#registration')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f8fafc',
        color: '#0f172a',
      }}
    >
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>Успешно потвърдихте имейла си</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6 }}>
          Акаунтът ви е активиран и можете да се логнете през мобилното приложение.
        </p>
      </div>
    </div>
  )
}
