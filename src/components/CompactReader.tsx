import { career, scenes } from '../content';
export function CompactReader({ index }: { index: number }) {
  return <section className="compact-reader" data-native-scroll="true" aria-label="Readable career information">
    <p className="reader-kicker">FUTURE CAREERS / {String(index+1).padStart(2,'0')} OF 05</p><h2>{scenes[index].name}</h2>
    {index === 0 && <><p>Designing Intelligence. Shaping Tomorrow.</p><h3>Computer Science → Artificial Intelligence</h3><p>{scenes[0].note}</p></>}
    {index === 1 && <><p>{career.description}</p><ul>{career.tasks.map(task => <li key={task}>{task}</li>)}</ul></>}
    {index === 2 && <><h3>Core Skills</h3><p>{career.skills.join(', ')}.</p><h3>Workplaces</h3><p>{career.workplaces.join(', ')}.</p><p>{career.environment}</p></>}
    {index === 3 && career.projects.map(project => <div key={project.title}><h3>{project.title}</h3><p>{project.text}</p></div>)}
    {index === 4 && <><p>{career.connection}</p>{career.foundations.map(([name,text]) => <div key={name}><h3>{name}</h3><p>{text}</p></div>)}</>}
  </section>;
}
