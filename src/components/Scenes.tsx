import type { ReactNode } from 'react';
import { career, scenes } from '../content';
import { TransitionLayers } from './TransitionLayers';

function Line({ children }: { children: string }) {
  return <span className="type-mask"><span data-line aria-hidden="true">{Array.from(children).map((char, i) => <span key={i} data-char>{char === ' ' ? '\u00a0' : char}</span>)}</span></span>;
}
function Title({ lines, intro = false }: { lines: string[]; intro?: boolean }) {
  return intro ? <h1 aria-label={lines.join(' ')}><span className="type-mask ai-word"><span data-line aria-hidden="true"><span data-char>A</span><span data-char className="intro-i">I</span></span></span><span className="type-mask engineer-word"><span data-line aria-hidden="true">{Array.from('ENGINEER').map((char, i) => <span key={i} data-char>{char}</span>)}</span></span></h1> : <h2 className="scene-title" aria-label={lines.join(' ')}>{lines.map(line => <Line key={line}>{line}</Line>)}</h2>;
}
function Frame({ index, className, children }: { index: number; className: string; children: ReactNode }) {
  return <section className={`scene ${className}`} data-scene={index} aria-label={`Scene ${index + 1}: ${scenes[index].name}`}>
    <header className="poster-top"><span>FUTURE CAREERS / COMPUTER SCIENCE</span><span>AI ENGINEER — 2026</span></header>
    {children}
    <footer className="poster-bottom"><span>{String(index + 1).padStart(2, '0')} / 05</span><span>DESIGNING INTELLIGENCE. SHAPING TOMORROW.</span><span>↗</span></footer>
  </section>;
}
function IntelligenceMark() {
  return <svg className="intelligence-mark" viewBox="0 0 300 300" fill="none" aria-hidden="true">
    <g data-mark stroke="currentColor" strokeWidth="1.05"><circle cx="150" cy="150" r="120" /><ellipse data-meridian cx="150" cy="150" rx="57" ry="120" transform="rotate(45 150 150)" /><ellipse data-meridian cx="150" cy="150" rx="57" ry="120" transform="rotate(-45 150 150)" /><circle cx="150" cy="150" r="57" /><path d="M0 150h300M150 0v300" opacity=".2" /></g>
    <circle cx="150" cy="150" r="3" fill="currentColor" /><path d="M16 16h12M22 10v12M272 16h12M278 10v12M16 284h12M22 278v12M272 284h12M278 278v12" stroke="currentColor" opacity=".35" />
  </svg>;
}
export function Scenes() {
  return <>
    <Frame index={0} className="scene-intro dark">
      <div className="hero-light-plane" data-hero-light aria-hidden="true" />
      <div className="intro-title"><Title intro lines={['AI','ENGINEER']} /><p data-enter className="intro-label">A FUTURE IN INTELLIGENCE</p></div>
      <div className="intro-geometry" data-enter><div className="environment-light" /><div className="depth-orbit" /><div data-parallax><div data-idle-spin><IntelligenceMark /></div></div><span className="geometry-caption">HUMAN IDEAS. MACHINE POSSIBILITIES.</span></div>
      <div className="intro-tagline" data-enter><p>Designing Intelligence.</p><p>Shaping Tomorrow.</p></div>
      <div className="intro-discipline" data-enter><span className="small-square" />COMPUTER SCIENCE → ARTIFICIAL INTELLIGENCE</div>
      <div className="hero-signature" data-signature aria-label="Presented by Yalex, Computer H262"><p className="signature-label">PRESENTED BY</p><p className="signature-name">Yalex</p><p className="signature-class">Computer H262</p></div>
    </Frame>
    <Frame index={1} className="scene-work light">
      <div className="hero-work-surface" data-work-surface aria-hidden="true" />
      <p className="scene-kicker" data-enter>02 — WHAT THEY DO</p>
      <Title lines={['Making','machines','intelligent.']} />
      <p className="work-description" data-enter>{career.description}</p>
      <div className="work-diagram" data-enter aria-label="Data becomes a model, then a solution"><div className="diagram-item"><div className="data-symbol"><i /><i /><i /><i /></div><span>DATA</span></div><span className="diagram-arrow">→</span><div className="diagram-item"><div className="model-symbol"><i /><i /><i /></div><span>MODEL</span></div><span className="diagram-arrow">→</span><div className="diagram-item"><div className="solution-symbol">↗</div><span>SOLUTION</span></div></div>
      <div className="work-tasks" data-enter>{career.tasks.map((task, i) => <p key={task}><span>{String(i + 1).padStart(2,'0')}</span>{task}</p>)}</div>
    </Frame>
    <Frame index={2} className="scene-skills dark">
      <p className="scene-kicker" data-enter>03 — SKILLS & WORKPLACE</p><Title lines={['Built with skill.','Better together.']} />
      <div className="skills-grid"><div className="skill-column" data-grid><span className="column-label">CORE SKILLS</span><ul>{career.skills.map(skill => <li data-enter key={skill}>{skill}</li>)}</ul><div className="skill-symbol" aria-hidden="true"><i /><i /><i /><i /></div></div><div className="place-column" data-grid><span className="column-label">WORKPLACES</span><ul>{career.workplaces.map(place => <li data-enter key={place}>{place}</li>)}</ul><div className="place-symbol" aria-hidden="true"><i /><i /><i /></div></div></div>
      <p className="work-environment" data-enter>Collaborative teams. Research, coding & testing.<br />In offices, labs or remote workspaces.</p><p className="poster-small-note" data-enter>TECHNICAL THINKING. HUMAN COLLABORATION.</p>
    </Frame>
    <Frame index={3} className="scene-projects light">
      <p className="scene-kicker" data-enter>04 — REAL-WORLD PROJECTS</p><Title lines={['Ideas become','impact.']} />
      <div className="project-grid">{career.projects.map((project, i) => <article className="project-card" data-card key={project.title}><div className="project-meta"><span>{String(i + 1).padStart(2,'0')}</span><span>↗</span></div><div className={`${project.symbol}-symbol`} aria-hidden="true">{Array.from({length: project.symbol === 'assistant' ? 5 : project.symbol === 'robot' ? 3 : 2}).map((_, j) => <i key={j} />)}</div><h3>{project.title}</h3><p>{project.text}</p></article>)}</div>
      <p className="project-closing" data-enter>From a useful conversation<br />to a life-changing discovery.</p>
    </Frame>
    <Frame index={4} className="scene-connection dark">
      <p className="scene-kicker" data-enter>05 — CONNECTION TO COMPUTER SCIENCE</p><Title lines={['Your major.','Your foundation.']} />
      <div className="connection-equation"><div className="equation-source"><span data-word>COMPUTER</span><span data-word>SCIENCE</span></div><span className="equation-arrow" data-word>→</span><span className="equation-result" data-word>AI ENGINEERING</span></div>
      <p className="connection-description" data-enter>{career.connection}</p><div className="foundation-grid" data-enter>{career.foundations.map(([name,text]) => <div key={name}><span>{name}</span><small>{text}</small></div>)}</div>
      <div className="connection-closing" data-enter><span>DESIGNING INTELLIGENCE.</span><span>SHAPING TOMORROW. ↗</span></div>
    </Frame>
    <TransitionLayers />
  </>;
}
