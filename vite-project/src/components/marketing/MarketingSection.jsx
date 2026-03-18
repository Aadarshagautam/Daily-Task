import React from 'react'

const joinClasses = (...classes) => classes.filter(Boolean).join(' ')

const MarketingSection = ({
  id,
  className = 'bg-white py-20',
  containerClassName = '',
  introClassName = 'max-w-3xl',
  contentClassName = '',
  eyebrow,
  title,
  description,
  eyebrowClassName = 'section-kicker',
  titleClassName = 'mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl',
  descriptionClassName = 'mt-4 text-base leading-7 text-slate-600',
  children,
}) => {
  const hasIntro = Boolean(eyebrow || title || description)

  return (
    <section id={id} className={className}>
      <div className={joinClasses('mx-auto max-w-7xl px-4 sm:px-6', containerClassName)}>
        {hasIntro ? (
          <div className={introClassName}>
            {eyebrow ? <p className={eyebrowClassName}>{eyebrow}</p> : null}
            {title ? <h2 className={titleClassName}>{title}</h2> : null}
            {description ? <p className={descriptionClassName}>{description}</p> : null}
          </div>
        ) : null}

        {children ? (
          <div className={joinClasses(hasIntro ? 'mt-10' : '', contentClassName)}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default MarketingSection
