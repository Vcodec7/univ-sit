import { Children, type ReactNode } from 'react';

type Props = {
  label: string;
  children: ReactNode;
};

/** Horizontal snap slides on the home page (spaces, clubs, news, projects). */
export default function HomeSlideRail({ label, children }: Props) {
  const slides = Children.toArray(children).filter(Boolean);
  if (!slides.length) return null;

  return (
    <div className="home-rail" role="region" aria-roledescription="carousel" aria-label={label}>
      {slides.map((slide, i) => (
        <div className="home-rail__slide" key={i}>
          {slide}
        </div>
      ))}
    </div>
  );
}
