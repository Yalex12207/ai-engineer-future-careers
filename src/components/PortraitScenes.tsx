import type { ReactNode } from 'react';
import { scenes } from '../content';
import { TransitionLayers } from './TransitionLayers';

function Mask({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`type-mask ${className}`}><span data-line>{children}</span></span>;
}
function Frame({ index, children, className }: { index: number; children: ReactNode; className: string }) {
  return <section className={`scene ${className}`} data-scene={index} aria-label={`Scene ${index + 1}: ${scenes[index].name}`}>
    <header className="poster-top"><span>FUTURE CAREERS</span><span>CS / 2026</span></header>
    {children}
    <footer className="poster-bottom"><span>{String(index + 1).padStart(2, '0')} / 05</span><span>ARTIFICIAL INTELLIGENCE ENGINEER</span><span>↗</span></footer>
  </section>;
}
function IntelligenceMark() {
  return <svg className="intelligence-mark" viewBox="0 0 300 300" fill="none" aria-hidden="true">
    <g data-mark stroke="currentColor" strokeWidth="1.3">
      <circle cx="150" cy="150" r="120" />
      <ellipse data-meridian cx="150" cy="150" rx="57" ry="120" transform="rotate(45 150 150)" />
      <ellipse data-meridian cx="150" cy="150" rx="57" ry="120" transform="rotate(-45 150 150)" />
      <circle cx="150" cy="150" r="57" />
      <path d="M0 150h300M150 0v300" opacity=".25" />
    </g>
    <circle cx="150" cy="150" r="5" fill="currentColor" />
    <path d="M16 16h12M22 10v12M272 16h12M278 10v12M16 284h12M22 278v12M272 284h12M278 278v12" stroke="currentColor" opacity=".5" />
  </svg>;
}
export function PortraitScenes({ interactive = false }: { interactive?: boolean }) {
  return <>
    <Frame index={0} className="scene-intro dark">
      <div className="intro-title"><h1><Mask className="ai-word">A<span className="intro-i">I</span></Mask><Mask className="engineer-word">ENGINEER</Mask></h1><p data-enter className="intro-label">A FUTURE IN INTELLIGENCE</p></div>
      <div className="intro-geometry" data-enter><div data-parallax><div data-idle-spin><IntelligenceMark /></div></div><span className="geometry-caption">HUMAN IDEAS. MACHINE POSSIBILITIES.</span></div>
      <div className="intro-tagline"><Mask>Designing Intelligence.</Mask><Mask>Shaping Tomorrow.</Mask></div>
      <div className="intro-discipline" data-enter><span className="small-square" />COMPUTER SCIENCE → ARTIFICIAL INTELLIGENCE</div>
    </Frame>

    <Frame index={1} className="scene-work light">
      <p className="scene-kicker" data-enter>02 — WHAT THEY DO</p>
      <h2 className="scene-title"><Mask>Making</Mask><Mask>machines</Mask><Mask>intelligent.</Mask></h2>
      <p className="work-description" data-enter>AI engineers develop intelligent systems using data, algorithms and machine learning.</p>
      <div className="work-diagram" data-enter aria-label="Data becomes a model, then a solution">
        <div className="diagram-item"><div className="data-symbol"><i /><i /><i /><i /></div><span>DATA</span></div><span className="diagram-arrow">→</span>
        <div className="diagram-item"><div className="model-symbol"><i /><i /><i /></div><span>MODEL</span></div><span className="diagram-arrow">→</span>
        <div className="diagram-item"><div className="solution-symbol">↗</div><span>SOLUTION</span></div>
      </div>
      <div className="work-tasks" data-enter><p><span>01</span> Prepare & understand data</p><p><span>02</span> Train & evaluate models</p><p><span>03</span> Deploy & improve systems</p></div>
    </Frame>

    <Frame index={2} className="scene-skills dark">
      <p className="scene-kicker" data-enter>03 — SKILLS & WORKPLACE</p>
      <h2 className="scene-title"><Mask>Built with skill.</Mask><Mask>Better together.</Mask></h2>
      <div className="skills-grid">
        <div className="skill-column" data-grid><span className="column-label">CORE SKILLS</span><ul><li data-enter>Python</li><li data-enter>Mathematics</li><li data-enter>Machine Learning</li><li data-enter>Teamwork</li><li data-enter>Problem-Solving</li></ul><div className="skill-symbol" aria-hidden="true"><i /><i /><i /><i /></div></div>
        <div className="place-column" data-grid><span className="column-label">WORKPLACES</span><ul><li data-enter>Technology<br />Companies</li><li data-enter>Research<br />Labs</li><li data-enter>Startups</li></ul><div className="place-symbol" aria-hidden="true"><i /><i /><i /></div></div>
      </div>
      <p className="work-environment" data-enter>Collaborative teams. Research, coding & testing.<br />In offices, labs or remote workspaces.</p>
      <p className="poster-small-note" data-enter>TECHNICAL THINKING. HUMAN COLLABORATION.</p>
    </Frame>

    <Frame index={3} className="scene-projects light">
      <p className="scene-kicker" data-enter>04 — REAL-WORLD PROJECTS</p>
      <h2 className="scene-title"><Mask>Ideas become</Mask><Mask>impact.</Mask></h2>
      <div className="project-grid">
        <article className="project-card" data-card><div className="project-meta"><span>01</span><span>↗</span></div><div className="assistant-symbol" aria-hidden="true"><i /><i /><i /><i /><i /></div><h3>AI Assistants</h3><p>Understand language.<br />Help people get things done.</p></article>
        <article className="project-card" data-card><div className="project-meta"><span>02</span><span>↗</span></div><div className="robot-symbol" aria-hidden="true"><i /><i /><i /></div><h3>Robotics</h3><p>Sense the environment.<br />Act in the physical world.</p></article>
        <article className="project-card" data-card><div className="project-meta"><span>03</span><span>↗</span></div><div className="vision-symbol" aria-hidden="true"><i /><i /></div><h3>Computer Vision</h3><p>Interpret images.<br />Recognize objects & patterns.</p></article>
        <article className="project-card" data-card><div className="project-meta"><span>04</span><span>↗</span></div><div className="health-symbol" aria-hidden="true"><i /><i /></div><h3>Healthcare AI</h3><p>Find patterns in medical data.<br />Support clinical decisions.</p></article>
      </div>
      <p className="project-closing" data-enter>From a useful conversation<br />to a life-changing discovery.</p>
    </Frame>

    <Frame index={4} className="scene-connection dark">
      <p className="scene-kicker" data-enter>05 — CONNECTION TO COMPUTER SCIENCE</p>
      <h2 className="scene-title"><Mask>Your major.</Mask><Mask>Your foundation.</Mask></h2>
      <div className="connection-equation"><span data-word>COMPUTER</span><span data-word>SCIENCE</span><span className="equation-arrow" data-word>↓</span><span className="equation-result" data-word>AI ENGINEERING</span></div>
      <p className="connection-description" data-enter>AI engineering applies programming, algorithms, data structures and mathematics to solve real-world problems.</p>
      <div className="foundation-grid" data-enter><div><span>Programming</span><small>Build the software</small></div><div><span>Algorithms</span><small>Guide how models learn</small></div><div><span>Data structures</span><small>Organize information</small></div><div><span>Mathematics</span><small>Understand the models</small></div></div>
      <div className="connection-closing" data-enter><span>DESIGNING INTELLIGENCE.</span><span>SHAPING TOMORROW. ↗</span></div>
    </Frame>
    {interactive ? <TransitionLayers /> : <>
      <div className="match-cut" aria-hidden="true"><span className="match-glyph">I</span><span className="match-shape" /></div>
      <div className="cinema-wipe" aria-hidden="true" />
      <div className="navigation-wipe" aria-hidden="true" />
    </>}
  </>;
}
