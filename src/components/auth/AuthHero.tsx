import React from 'react'

type AuthHeroProps = {
  imageUrl: string
  heading: React.ReactNode
  subtext?: string   // now optional
}

export default function AuthHero({ imageUrl, heading, subtext }: AuthHeroProps) {
  return (
    <div className="signup-hero" style={{ backgroundImage: `url(${imageUrl})` }}>
      <div className="signup-hero-content">
        <h1>{heading}</h1>
        {subtext && <p>{subtext}</p>}
        <div className="signup-hero-dots">
          <button className="dot-button dot-active" aria-label="Slide 1" />
          <button className="dot-button dot-inactive" aria-label="Slide 2" />
          <button className="dot-button dot-inactive" aria-label="Slide 3" />
        </div>
      </div>
    </div>
  )
}