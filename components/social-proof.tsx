'use client'

import { Banknote, Heart, Share2, Users } from 'lucide-react'
import { campaign, formatNaira } from '@/lib/campaign'
import { useCountUp } from '@/hooks/use-count-up'
import { Reveal } from '@/components/reveal'

const recentDonors = [
  { name: 'Anonymous', amount: 300_000, time: '16/06/2026' },
  { name: 'Anonymous', amount: 200_000, time: '16/06/2026' },
  { name: 'Anonymous', amount: 200_000, time: '17/06/2026' },
  { name: 'Ojuolape Abiola', amount: 10_000, time: '18/06/2026' },
  { name: 'Anonymous', amount: 50_000, time: '19/06/2026' },
  { name: 'Anonymous', amount: 5_000, time: '19/06/2026' },
  { name: 'Anonymous', amount: 250_000, time: '21/06/2026' },
  { name: 'Anonymous', amount: 100_000, time: '21/06/2026' },
  { name: 'Anonymous', amount: 20_000, time: '23/06/2026' },
  { name: 'Anonymous', amount: 1_500, time: '23/06/2026' },
]

export function SocialProof() {
  const donors = useCountUp(campaign.funds.donors)
  const shares = useCountUp(campaign.funds.shares)
  const raised = useCountUp(campaign.funds.raised)

  return (
    <section className="bg-primary py-20 text-primary-foreground sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="grid gap-6 sm:grid-cols-3">
          <Counter
            ref={donors.ref}
            icon={Users}
            value={donors.value.toLocaleString()}
            label="Generous Donors"
          />
          <Counter
            ref={shares.ref}
            icon={Share2}
            value={shares.value.toLocaleString()}
            label="Times Shared"
          />
          <Counter
            ref={raised.ref}
            icon={Banknote}
            value={formatNaira(raised.value)}
            label="Raised So Far"
          />
        </Reveal>

        <Reveal delay={120} className="mx-auto mt-12 max-w-2xl">
          <h3 className="mb-4 flex items-center justify-center gap-2 font-heading text-lg font-bold">
            <Heart className="size-5" fill="currentColor" aria-hidden="true" />
            Recent Donations
          </h3>
          <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm">
            {recentDonors.map((d, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-5 py-3.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-teal text-teal-foreground">
                    <Heart className="size-4" fill="currentColor" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-xs text-primary-foreground/70">{d.time}</p>
                  </div>
                </div>
                <span className="font-heading font-bold text-teal-foreground">
                  {formatNaira(d.amount)}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function Counter({
  ref,
  icon: Icon,
  value,
  label,
}: {
  ref: React.Ref<HTMLSpanElement>
  icon: typeof Users
  value: string
  label: string
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm">
      <Icon className="mx-auto size-7 text-teal-foreground" aria-hidden="true" />
      <p className="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">
        <span ref={ref}>{value}</span>
      </p>
      <p className="mt-1 text-sm text-primary-foreground/80">{label}</p>
    </div>
  )
}
