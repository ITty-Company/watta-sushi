'use client'

type WattaHeroRollMobileIntroProps = {
  titleLines: string[]
  body: string
  ariaLabel: string
}

export default function WattaHeroRollMobileIntro({
  titleLines,
  body,
  ariaLabel,
}: WattaHeroRollMobileIntroProps) {
  return (
    <div className="watta-sushi-roll-hero__mobile-intro" aria-label={ariaLabel}>
      <h2 className="watta-sushi-roll-hero__mobile-intro-title">
        {titleLines.map((line, index) => (
          <span
            key={`${line}-${index}`}
            className={
              index === 1
                ? 'watta-sushi-roll-hero__mobile-intro-line watta-sushi-roll-hero__mobile-intro-line--script'
                : 'watta-sushi-roll-hero__mobile-intro-line'
            }
          >
            {line}
          </span>
        ))}
      </h2>
      <p className="watta-sushi-roll-hero__mobile-intro-body" style={{ whiteSpace: 'pre-line' }}>
        {body}
      </p>
    </div>
  )
}
