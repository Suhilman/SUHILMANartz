import React from 'react';
import styled, { keyframes } from 'styled-components';

/**
 * React port of the former public/cv-suhilman.html — same design, same CSS
 * values, now a component instead of a static file. Content lives in
 * public/data/cvContent.js (loaded dynamically below since CRA's
 * ModuleScopePlugin blocks static imports from outside src/), shared with
 * the vector PDF generator in public/pdf/cv.js so both stay in sync.
 */
const CvDocument = () => {
  const [content, setContent] = React.useState(null);

  React.useEffect(() => {
    const url = `${process.env.PUBLIC_URL}/data/cvContent.js`;
    import(/* webpackIgnore: true */ url).then((mod) => setContent(mod.default));
  }, []);

  if (!content) return <Backdrop />;

  return (
    <Backdrop>
      <Page>
        <Sidebar>
          <AvatarWrap>
            <AvatarRing />
            <AvatarInner>
              <img src={`${process.env.PUBLIC_URL}/${content.avatarSrc}`} alt={content.name} />
            </AvatarInner>
            <AvatarStatus title="Available" />
          </AvatarWrap>
          <Name>{content.name}</Name>
          <Role>{content.role}</Role>
          <AccentBar />

          <SSection>
            <SectionTitle>Contact</SectionTitle>
            <ContactList>
              {content.contact.map((c) => (
                <ContactItem key={c.label}>
                  <span className="label">{c.label}</span>
                  <span className="value">{c.value}</span>
                </ContactItem>
              ))}
            </ContactList>
          </SSection>

          <SSection>
            <SectionTitle>Professional</SectionTitle>
            {content.professionalSkills.map((s) => (
              <Skill key={s.name} name={s.name} pct={s.pct} />
            ))}
          </SSection>

          <SSection>
            <SectionTitle>Soft Skills</SectionTitle>
            {content.softSkills.map((s) => (
              <Skill key={s.name} name={s.name} pct={s.pct} />
            ))}
          </SSection>

          <SSection $last>
            <SectionTitle>Languages</SectionTitle>
            {content.languages.map((l) => (
              <LangItem key={l.name}>
                <strong>{l.name}</strong>
                <span>{l.level}</span>
              </LangItem>
            ))}
          </SSection>
        </Sidebar>

        <Main>
          <MainHead>
            <div>
              <MainEyebrow>{content.eyebrow}</MainEyebrow>
              <MainTitle>{content.title}</MainTitle>
            </div>
            <MainTag>{content.tag}</MainTag>
          </MainHead>

          <MSection>
            <KpiGrid>
              {content.kpis.map((k) => (
                <Kpi key={k.n}>
                  <div className="n">{k.n}</div>
                  <div className="l">
                    {k.label.split('\n').map((line, i) => (
                      <React.Fragment key={line}>
                        {i > 0 && <br />}
                        {line}
                      </React.Fragment>
                    ))}
                  </div>
                </Kpi>
              ))}
            </KpiGrid>
          </MSection>

          <MSection>
            <MTitle><span className="num">{'// 01'}</span><h2>Profile</h2></MTitle>
            <ProfileText>
              {content.profile.map((seg, i) => (seg.strong ? <strong key={i}>{seg.text}</strong> : <React.Fragment key={i}>{seg.text}</React.Fragment>))}
            </ProfileText>
          </MSection>

          <MSection>
            <MTitle><span className="num">{'// 02'}</span><h2>Experience</h2></MTitle>
            {content.jobs.map((job, i) => (
              <Job key={job.company} $last={i === content.jobs.length - 1}>
                <div className="job-head">
                  <div className="job-company">{job.company}</div>
                  <div className="job-period">{job.period}</div>
                </div>
                <div className="job-sub">
                  <div className="job-role">{job.role}</div>
                  <div className="job-loc">{job.location}</div>
                </div>
                <ul>
                  {job.bullets.map((runs, bi) => (
                    <li key={bi}>{runs.map((seg, si) => (seg.strong ? <strong key={si}>{seg.text}</strong> : <React.Fragment key={si}>{seg.text}</React.Fragment>))}</li>
                  ))}
                </ul>
                <div className="job-tech"><strong>Tech</strong>&nbsp;{job.tech}</div>
              </Job>
            ))}
          </MSection>

          <MSection>
            <MTitle><span className="num">{'// 03'}</span><h2>Education</h2></MTitle>
            <Split2>
              {content.education.map((e) => (
                <EduItem key={e.school}>
                  <div className="edu-dot" />
                  <div className="edu-info">
                    <div className="edu-school">{e.school}</div>
                    <div className="edu-major">{e.major}</div>
                  </div>
                  <div className="edu-year">{e.year}</div>
                </EduItem>
              ))}
            </Split2>
          </MSection>

          <MSection $last>
            <MTitle><span className="num">{'// 04'}</span><h2>Tech Stack &amp; Portfolio</h2></MTitle>
            <BottomCard>
              <StackChips>
                {content.techStack.map((t) => <span className="chip" key={t}>{t}</span>)}
              </StackChips>
              <QrCard>
                <img
                  alt="Scan portfolio"
                  crossOrigin="anonymous"
                  src={`https://quickchart.io/qr?text=${encodeURIComponent(content.portfolioUrl)}&size=320&dark=07070d&light=ffffff&margin=0&ecLevel=Q&format=png`}
                />
                <div className="qr-label">Scan Me</div>
                <div className="qr-url">suhilman.github.io/<br />SUHILMANartz</div>
              </QrCard>
            </BottomCard>
          </MSection>
        </Main>
      </Page>
    </Backdrop>
  );
};

export default CvDocument;

const Skill = ({ name, pct }) => (
  <SkillWrap>
    <div className="skill-head"><span className="skill-name">{name}</span><span className="skill-lv">{pct}%</span></div>
    <div className="bar"><span style={{ width: `${pct}%` }} /></div>
  </SkillWrap>
);

// ---------------------------------------------------------------------------
const spin = keyframes`to { transform: rotate(360deg); }`;

const Backdrop = styled.div`
  min-height: 100%;
  width: 100%;
  background: #f4f6fa;
  padding: 24px 0;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.55;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  display: flex;
  justify-content: center;

  /* The original document reset every element with *{margin:0;padding:0;box-sizing:
     border-box} -- without it, native tags like h1/h2 keep browser default margins
     (e.g. h2's ~0.83em) that throw off the flex align-items:flex-end pairings below. */
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
`;

const Page = styled.div`
  width: 210mm;
  height: 297mm;
  flex-shrink: 0;
  background: #fff;
  box-shadow: 0 8px 40px rgba(15, 23, 42, .18);
  display: grid;
  grid-template-columns: 74mm 1fr;
  border-radius: 6px;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
    z-index: 5;
    border-radius: 6px 6px 0 0;
  }
  @media (max-width: 760px) {
    width: 100%;
    height: auto;
    border-radius: 0;
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  background: #07070d;
  color: #e8e9f3;
  padding: 24px 20px 22px;
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 8%, rgba(0, 240, 255, .12), transparent 50%),
      radial-gradient(circle at 80% 90%, rgba(177, 74, 255, .10), transparent 50%);
    pointer-events: none;
  }
  > * { position: relative; z-index: 1; }
`;

const AvatarWrap = styled.div`
  position: relative;
  width: 108px;
  height: 108px;
  margin: 20px auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  &::before, &::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid #00f0ff;
    z-index: 2;
  }
  &::before { top: -5px; left: -5px; border-right: none; border-bottom: none; }
  &::after { bottom: -5px; right: -5px; border-left: none; border-top: none; border-color: #ff5b94; }
`;

const AvatarRing = styled.div`
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #00f0ff, #b14aff, #ff5b94, #00f0ff);
  animation: ${spin} 8s linear infinite;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(from 0deg, #00f0ff, #b14aff, #ff5b94, #00f0ff);
    filter: blur(12px);
    opacity: .5;
    z-index: -1;
  }
`;

const AvatarInner = styled.div`
  position: relative;
  width: 102px;
  height: 102px;
  border-radius: 50%;
  overflow: hidden;
  background: #11111c;
  border: 2px solid #07070d;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .08), 0 6px 18px rgba(0, 0, 0, .45);
  img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; filter: contrast(1.05) saturate(1.05); }
`;

const AvatarStatus = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #07070d;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, .25), 0 0 8px rgba(34, 197, 94, .7);
  z-index: 3;
`;

const Name = styled.h1`
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-weight: 700;
  font-size: 30px;
  line-height: 1;
  letter-spacing: -.02em;
  background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 6px;
  text-align: center;
`;

const Role = styled.div`
  font-size: 11px;
  color: #8b8da3;
  margin-bottom: 16px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: .04em;
`;

const AccentBar = styled.div`
  width: 55%;
  height: 2.5px;
  background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
  border-radius: 2px;
  margin: 0 auto 18px;
`;

const SSection = styled.div`
  margin-bottom: ${({ $last }) => ($last ? 0 : '16px')};
`;

const SectionTitle = styled.div`
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: .16em;
  color: #00f0ff;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  &::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(0, 240, 255, .5), transparent); }
`;

const ContactList = styled.div`display: flex; flex-direction: column; gap: 9px;`;

const ContactItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10.5px;
  word-break: break-word;
  .label { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: .16em; color: #00f0ff; text-transform: uppercase; }
  .value { color: #e8e9f3; line-height: 1.4; }
`;

const SkillWrap = styled.div`
  margin-bottom: 9px;
  .skill-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
  .skill-name { font-size: 10.5px; color: #e8e9f3; font-weight: 500; }
  .skill-lv { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #8b8da3; }
  .bar { height: 4px; background: rgba(255, 255, 255, .06); border-radius: 999px; overflow: hidden; }
  .bar > span { display: block; height: 100%; background: linear-gradient(135deg, #00f0ff, #b14aff); border-radius: 999px; }
`;

const LangItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  padding: 4px 0;
  strong { color: #e8e9f3; font-weight: 600; }
  span { color: #8b8da3; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; }
`;

const Main = styled.main`
  padding: 20px 24px 18px;
  color: #0f172a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MainHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
  padding-bottom: 9px;
  border-bottom: 1px solid #e2e8f0;
`;

const MainEyebrow = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: .2em;
  color: #b14aff;
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const MainTitle = styled.div`
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: .03em;
  color: #0f172a;
  text-transform: uppercase;
`;

const MainTag = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  color: #475569;
  letter-spacing: .05em;
  white-space: nowrap;
`;

const MSection = styled.section`margin-bottom: ${({ $last }) => ($last ? 0 : '6px')};`;

const MTitle = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 7px;
  .num { font-family: 'JetBrains Mono', monospace; font-size: 10px; line-height: 1; color: #b14aff; letter-spacing: .18em; text-transform: uppercase; padding-bottom: 2px; }
  h2 { font-family: 'Space Grotesk', 'Inter', sans-serif; font-weight: 700; font-size: 17px; letter-spacing: -.01em; color: #0f172a; line-height: 1; }
  &::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; margin-bottom: 5px; }
`;

const ProfileText = styled.p`
  font-size: 10.5px;
  line-height: 1.55;
  color: #475569;
  strong { color: #0f172a; font-weight: 600; }
`;

const KpiGrid = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;`;

const Kpi = styled.div`
  background: linear-gradient(135deg, #f8fafc, #fff);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 7px 10px;
  position: relative;
  overflow: hidden;
  &::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: linear-gradient(135deg, #00f0ff, #b14aff); }
  .n {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-weight: 700;
    font-size: 17px;
    line-height: 1;
    background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 2px;
  }
  .l { font-family: 'JetBrains Mono', monospace; font-size: 7.5px; letter-spacing: .1em; color: #475569; text-transform: uppercase; line-height: 1.3; }
`;

const Job = styled.article`
  margin-bottom: ${({ $last }) => ($last ? '3px' : '7px')};
  ${({ $last }) => !$last && `padding-bottom: 7px; border-bottom: 1px dashed #e2e8f0;`}
  .job-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; }
  .job-company { font-family: 'Space Grotesk', 'Inter', sans-serif; font-weight: 700; font-size: 12px; color: #0f172a; }
  .job-period { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #b14aff; font-weight: 500; }
  .job-sub { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .job-role { font-size: 10px; font-weight: 600; color: #0891b2; }
  .job-loc { font-size: 8.5px; color: #475569; font-family: 'JetBrains Mono', monospace; }
  ul { list-style: none; padding: 0; margin: 0 0 4px; }
  li { position: relative; padding-left: 11px; margin-bottom: 2px; font-size: 9.5px; line-height: 1.45; color: #0f172a; }
  li::before { content: '▸'; position: absolute; left: 0; top: 0; color: #00f0ff; font-weight: 700; }
  li strong { color: #0f172a; font-weight: 600; }
  .job-tech {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
    color: #7c3aed;
    background: #f5f3ff;
    border-left: 2px solid #b14aff;
    padding: 4px 7px;
    border-radius: 0 4px 4px 0;
    margin-top: 3px;
    line-height: 1.45;
    strong { color: #b14aff; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; font-size: 8px; }
  }
`;

/* grid-auto-flow:column (not the default row) fills column 1 top-to-bottom first, then
   column 2 — matching content.education's natural [newest..oldest] order — while still
   being a REAL grid (unlike two independently-stacked divs), so item 1 & item 3 share
   row 1's height and item 2 & item 4 share row 2's, even when one wraps to 2 lines. */
const Split2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(2, auto);
  grid-auto-flow: column;
  gap: 4px 18px;
  align-items: start;
`;

const EduItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px dashed #e2e8f0;
  /* grid-auto-flow:column means the bottom row is the last TWO dom siblings (one per
     column), not just the very last one — :last-child alone would leave a dangling
     divider under the first column's bottom item. */
  &:nth-last-child(-n+2) { border-bottom: none; }
  .edu-dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%); flex-shrink: 0; }
  .edu-info { flex: 1; min-width: 0; }
  .edu-school { font-weight: 700; font-size: 11px; color: #0f172a; line-height: 1.25; }
  .edu-major { font-size: 9.5px; color: #475569; margin-top: 1px; }
  .edu-year { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #b14aff; font-weight: 500; flex-shrink: 0; }
`;

const BottomCard = styled.div`
  display: grid;
  grid-template-columns: 1fr 96px;
  gap: 12px;
  align-items: center;
  background: linear-gradient(135deg, #fafbfd, #fff);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 9px 12px;
  margin-top: 2px;
`;

const StackChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  .chip { font-family: 'Inter', sans-serif; font-size: 8.5px; font-weight: 500; padding: 2px 7px; background: #13131f; border: 1px solid #26263a; border-radius: 999px; color: #e8e9f3; }
`;

const QrCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  img { width: 72px; height: 72px; display: block; }
  .qr-label { font-family: 'JetBrains Mono', monospace; font-size: 7.5px; letter-spacing: .18em; color: #b14aff; text-transform: uppercase; font-weight: 700; }
  .qr-url { font-family: 'JetBrains Mono', monospace; font-size: 7px; color: #475569; text-align: center; letter-spacing: .02em; }
`;
