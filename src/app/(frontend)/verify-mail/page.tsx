import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function VerifyMailPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const token = Array.isArray(resolvedSearchParams.token)
    ? resolvedSearchParams.token[0]
    : resolvedSearchParams.token

  if (!token) {
    redirect('/for-users/faq#registration')
  }

  const params = new URLSearchParams()
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (value === undefined) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
      return
    }

    params.append(key, value)
  })

  redirect(`/verify-email?${params.toString()}`)
}
