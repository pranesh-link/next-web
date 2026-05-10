"use client";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ProfileContext } from "@/_store/profile/page/context";
import {
  Cursor,
  HeroContainer,
  HeroContent,
  JobRole,
  MouseGradient,
  Name,
  ParticleGrid,
  Pill,
  PillIcon,
  PillsContainer,
  TaglineWrapper,
} from "./HeroSection.styled";

const interestPills = [
  { icon: "🛠", label: "What I Know", section: "skills" },
  { icon: "🏢", label: "My Journey", section: "experience" },
  { icon: "🎓", label: "Education", section: "education" },
  { icon: "📦", label: "Projects", section: "open-source" },
];

/**
 * Renders quick-jump pill buttons that scroll to top-level sections.
 *
 * @returns A horizontal pill strip used inside the hero.
 */
const InterestPills: React.FC = () => {
  const handleClick = (section: string) => {
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PillsContainer>
      {interestPills.map((pill) => (
        <Pill key={pill.section} onClick={() => handleClick(pill.section)}>
          <PillIcon>{pill.icon}</PillIcon>
          {pill.label}
        </Pill>
      ))}
    </PillsContainer>
  );
};

/**
 * Props for the {@link Typewriter} helper.
 */
interface TypewriterProps {
  /** Text content typed character-by-character. */
  text: string;
  /** Initial delay in ms before typing begins. */
  delay?: number;
}

/**
 * Animates a string with a character-by-character typewriter effect.
 *
 * @param props - {@link TypewriterProps}.
 * @returns The animated tagline element.
 */
const Typewriter: React.FC<TypewriterProps> = ({ text, delay = 1800 }) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, 28);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <TaglineWrapper>
      {displayed}
      {!done && <Cursor />}
    </TaglineWrapper>
  );
};

/**
 * Dark-themed hero section for profile-3.0 with parallax particles, a
 * mouse-tracking radial gradient, animated heading and quick-nav pills.
 *
 * @returns The hero section element.
 */
export const DarkHeroSection: React.FC = () => {
  const {
    data: { header },
  } = useContext(ProfileContext);

  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHasInteracted(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <HeroContainer id="hero" ref={containerRef}>
      <ParticleGrid $scrollY={scrollY} />
      {hasInteracted && <MouseGradient $x={mousePos.x} $y={mousePos.y} />}
      <HeroContent $scrollY={scrollY}>
        <Name>{header.greeting || header.name}</Name>
        <JobRole>{header.currentJobRole}</JobRole>
        {header.tagline && <Typewriter text={header.tagline} />}
        <InterestPills />
      </HeroContent>
    </HeroContainer>
  );
};

export default DarkHeroSection;
