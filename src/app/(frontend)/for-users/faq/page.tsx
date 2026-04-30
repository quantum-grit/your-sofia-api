import React, { type ReactNode } from 'react'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Често задавани въпроси – Твоята София',
  description:
    'Отговори на най-честите въпроси за мобилното приложение „Твоята София" – как да се регистрирам, как да подам сигнал, как работи картата.',
}

const faqs: { q: string; a: ReactNode }[] = [
  {
    q: 'Безплатно ли е приложението?',
    a: 'Да, приложението „Твоята София" е напълно безплатно и не съдържа реклами. Финансира се от Столична община.',
  },
  {
    q: 'Нужна ли е регистрация?',
    a: 'Основните функционалности – новини, карта, качество на въздуха и транспорт – са достъпни без регистрация. За подаване на сигнали е необходим акаунт.',
  },
  {
    q: 'Как да подам сигнал за проблем?',
    a: 'Отворете раздел „Сигнали" в приложението, изберете категория, маркирайте местоположението на картата и добавете описание и снимка (по желание). Сигналът се изпраща директно до съответния отдел на Общината.',
  },
  {
    q: 'Мога ли да следя статуса на моя сигнал?',
    a: 'Да. В раздел „Моите сигнали" виждате всички ваши подадени сигнали и техния статус – нов, в процес, решен.',
  },
  {
    q: 'Откъде идват данните за контейнерите за отпадъци?',
    a: 'Позиционирането на контейнерите се контролира от Столичен Инспекторат. Данните за сметоизвозването се получават от GPS системите на фирмите, обслужващи контейнерите в Столична община.',
  },
  {
    q: 'На какви езици е приложението?',
    a: 'Приложението поддържа български и английски език. Езикът се избира при първото стартиране или от настройките.',
  },
  {
    q: 'Приложението достъпно ли е за хора с увреждания?',
    a: 'Работим активно за подобряване на достъпността. Приложението поддържа системните инструменти за достъпност на iOS и Android (VoiceOver/TalkBack).',
  },
  {
    q: 'Как да съобщя за грешка в приложението?',
    a: (
      <>
        Можете да отворите тикет в{' '}
        <a
          href="https://github.com/sofia-municipality/your-sofia-mobile/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          GitHub хранилището на проекта
        </a>{' '}
        или да се свържете с нас чрез{' '}
        <a
          href="https://call.sofia.bg/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Контактния център на Столична община
        </a>
        .
      </>
    ),
  },
  {
    q: 'Как се опазват личните ми данни?',
    a: (
      <>
        Личните ви данни се обработват в съответствие с GDPR и политиката за поверителност на
        Столична община. Събираме само минималния обем данни, необходим за функционирането на
        услугата. Пълните детайли можете да намерите в нашите{' '}
        <Link href="/terms-of-use" className="text-blue-600 hover:underline">
          Условия за ползване и Политика за поверителност
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Как да изтрия профила си, ако вече не искам да съм регистриран?',
    a: (
      <>
        Можете да поискате пълно изтриване на акаунта и всички свързани лични данни чрез нашата{' '}
        <Link href="/forget-me" className="text-blue-600 hover:underline">
          страница за изтриване на профил
        </Link>
        . Заявката се обработва в срок до 30 дни съгласно изискванията на GDPR.
      </>
    ),
  },
  {
    q: 'Изходният код отворен ли е?',
    a: (
      <>
        Да, целият изходен код е публично достъпен в{' '}
        <a
          href="https://github.com/sofia-municipality/your-sofia-mobile"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          GitHub хранилището на проекта
        </a>{' '}
        под лиценз EUPL-1.2. Приносите от общността са добре дошли.
      </>
    ),
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Често задавани въпроси</h1>
            <p className="text-xl text-gray-600">
              Не намирате отговора? Пишете ни на{' '}
              <a href="mailto:yoursofia@sofia.bg" className="text-blue-600 hover:underline">
                yoursofia@sofia.bg
              </a>
            </p>
          </div>

          {/* FAQ list */}
          <div className="space-y-4 mb-12">
            {faqs.map(({ q, a }, idx) => (
              <details
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-gray-100 group"
              >
                <summary className="flex justify-between items-center cursor-pointer px-6 py-4 font-medium text-gray-900 list-none">
                  {q}
                  <span className="text-blue-600 text-lg group-open:rotate-45 transition-transform duration-150 ml-4 flex-shrink-0">
                    +
                  </span>
                </summary>
                <p className="px-6 pb-4 text-gray-600 leading-relaxed text-sm">{a}</p>
              </details>
            ))}
          </div>

          {/* Footer nav */}
          <div className="text-center flex justify-center gap-6 text-sm flex-wrap">
            <Link href="/for-users/features" className="text-blue-600 hover:underline">
              ← Основни функционалности
            </Link>
            <Link href="/terms-of-use" className="text-blue-600 hover:underline">
              Условия за ползване →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
