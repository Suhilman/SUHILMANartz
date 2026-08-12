import React from 'react';
import styled, { keyframes } from 'styled-components';

/**
 * React port of the former public/portfolio.html — same design, same CSS
 * values, now a component instead of a static file. Content lives in
 * public/data/portfolioContent.js (loaded dynamically below since CRA's
 * ModuleScopePlugin blocks static imports from outside src/), shared with
 * the vector PDF generator in public/pdf/portfolio.js so both stay in sync.
 */
const PortfolioDocument = () => {
  const [content, setContent] = React.useState(null);

  React.useEffect(() => {
    const url = `${process.env.PUBLIC_URL}/data/portfolioContent.js`;
    import(/* webpackIgnore: true */ url).then((mod) => setContent(mod.default));
  }, []);

  if (!content) return <Backdrop />;

  return (
    <Backdrop>
      <Page>
        <Header>
          <HeaderGrid>
            <AvatarWrap>
              <AvatarRing />
              <AvatarInner>
                <img src={`${process.env.PUBLIC_URL}/${content.avatarSrc}`} alt={content.name} />
              </AvatarInner>
            </AvatarWrap>

            <HeadId>
              <div className="eyebrow">{content.eyebrow}</div>
              <h1>{content.name}</h1>
              <div className="role">{content.role} <span className="sep">·</span> {content.roleSuffix}</div>
              <p className="desc">{content.desc}</p>
            </HeadId>

            <HeadMeta>
              {content.headMeta.map((m) => (
                <div className="meta-row" key={m.label}><span className="l">{m.label}</span> {m.value}</div>
              ))}
              <div className="meta-status"><span className="dot" /> {content.availableStatus}</div>
            </HeadMeta>
          </HeaderGrid>
        </Header>

        <BodyWrap>
          <Highlights>
            {content.highlights.map((h) => (
              <Highlight key={h.n}><div className="n">{h.n}</div><div className="l">{h.label}</div></Highlight>
            ))}
          </Highlights>

          <Section>
            <SectionTitle><span className="num">{'// 01'}</span><h2>Featured Work</h2></SectionTitle>
            <Projects>
              {content.projects.map((p) => (
                <Project key={p.glyph}>
                  <div className="project-head">
                    <div className="project-glyph">{p.glyph}</div>
                    <Pin $variant={p.pin}>{p.pinLabel}</Pin>
                  </div>
                  <h3>{p.title}</h3>
                  <div className="meta">{p.meta}</div>
                  <p>{p.desc}</p>
                  <div className="tags">{p.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
                </Project>
              ))}
              <MoreProjects>
                <div className="n">{content.moreProjects.n}</div>
                <div className="l">
                  {content.moreProjects.label.split('\n').map((line, i) => (
                    <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>
                  ))}
                </div>
              </MoreProjects>
            </Projects>
          </Section>

          <TwoCol>
            <ColStackGrid>
              <Section>
                <SectionTitle><span className="num">{'// 02'}</span><h2>Core Skills</h2></SectionTitle>
                {content.coreSkills.map((s) => <Skill key={s.name} name={s.name} pct={s.pct} />)}
              </Section>
              <Section>
                <SectionTitle><span className="num">{'// 03'}</span><h2>Tech Stack</h2></SectionTitle>
                <StackChips>{content.techStack.map((t) => <span className="chip" key={t}>{t}</span>)}</StackChips>
              </Section>
            </ColStackGrid>

            <ColStackGrid>
              <Section>
                <SectionTitle><span className="num">{'// 04'}</span><h2>Get in Touch</h2></SectionTitle>
                <ContactBlock>
                  <ContactInfo>
                    <h3>{content.contactHeading.map((seg, i) => (seg.grad ? <span className="grad" key={i}>{seg.text}</span> : <React.Fragment key={i}>{seg.text}</React.Fragment>))}</h3>
                    <div className="sub">{content.contactSub}</div>
                    <ContactList>
                      {content.contact.map((c) => (
                        <ContactItem key={c.label} style={c.span ? { gridColumn: '1 / -1' } : undefined}>
                          <span className="l">{c.label}</span>
                          <span className="v">{c.value}</span>
                        </ContactItem>
                      ))}
                    </ContactList>
                  </ContactInfo>
                  <QrMini>
                    <img
                      alt="Scan portfolio"
                      crossOrigin="anonymous"
                      src={`https://quickchart.io/qr?text=${encodeURIComponent(content.portfolioUrl)}&size=320&dark=07070d&light=ffffff&margin=0&ecLevel=Q&format=png`}
                    />
                    <div className="l">Scan Me</div>
                  </QrMini>
                </ContactBlock>
              </Section>
            </ColStackGrid>
          </TwoCol>
        </BodyWrap>
      </Page>
    </Backdrop>
  );
};

export default PortfolioDocument;

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
     border-box} -- without it, native tags like h1/h3 keep browser default margins
     that throw off the flex align-items:flex-end/baseline pairings below. */
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
`;

const Page = styled.div`
  width: 210mm;
  min-height: 297mm;
  flex-shrink: 0;
  background: #fff;
  box-shadow: 0 8px 40px rgba(15, 23, 42, .18);
  border-radius: 6px;
  position: relative;
  display: flex;
  flex-direction: column;
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
    z-index: 5;
    border-radius: 6px 6px 0 0;
  }
  @media (max-width: 760px) { width: 100%; border-radius: 0; }
`;

const Header = styled.header`
  background: #07070d;
  color: #e8e9f3;
  padding: 22px 26px 20px;
  position: relative;
  overflow: hidden;
  border-radius: 6px 6px 0 0;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 15% 10%, rgba(0, 240, 255, .14), transparent 50%),
      radial-gradient(circle at 85% 90%, rgba(177, 74, 255, .12), transparent 50%),
      radial-gradient(circle at 60% 40%, rgba(255, 91, 148, .06), transparent 55%);
    pointer-events: none;
  }
`;

const HeaderGrid = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: 18px;
  align-items: center;
  @media (max-width: 760px) { grid-template-columns: 1fr; text-align: center; }
`;

const AvatarWrap = styled.div`
  position: relative;
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  &::before, &::after { content: ''; position: absolute; width: 11px; height: 11px; border: 2px solid #00f0ff; z-index: 2; }
  &::before { top: -5px; left: -5px; border-right: none; border-bottom: none; }
  &::after { bottom: -5px; right: -5px; border-left: none; border-top: none; border-color: #ff5b94; }
`;

const AvatarRing = styled.div`
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #00f0ff, #b14aff, #ff5b94, #00f0ff);
  filter: blur(.5px);
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
  width: 82px;
  height: 82px;
  border-radius: 50%;
  overflow: hidden;
  background: #11111c;
  border: 2px solid #07070d;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .08), 0 6px 18px rgba(0, 0, 0, .45);
  img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; filter: contrast(1.05) saturate(1.05); }
`;

const HeadId = styled.div`
  .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .2em; color: #00f0ff; text-transform: uppercase; margin-bottom: 5px; }
  h1 {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-weight: 700;
    font-size: 34px;
    line-height: 1;
    letter-spacing: -.025em;
    background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 6px;
    display: inline-block;
  }
  .role { font-size: 12.5px; color: #e8e9f3; font-weight: 500; }
  .role .sep { color: #00f0ff; margin: 0 6px; }
  .desc { font-size: 10.5px; color: #8b8da3; margin-top: 6px; max-width: 60ch; line-height: 1.55; }
`;

const HeadMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
  min-width: 140px;
  .meta-row { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .04em; color: #e8e9f3; display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
  .meta-row .l { font-size: 8px; color: #00f0ff; letter-spacing: .16em; text-transform: uppercase; }
  .meta-status {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: 'JetBrains Mono', monospace; font-size: 9.5px; color: #e8e9f3;
    background: rgba(34, 197, 94, .12); border: 1px solid rgba(34, 197, 94, .35);
    padding: 3px 10px; border-radius: 999px; align-self: flex-end; margin-top: 5px;
  }
  .meta-status .dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, .8); }
  @media (max-width: 760px) { align-items: center; text-align: center; .meta-row { justify-content: center; } .meta-status { align-self: center; } }
`;

const BodyWrap = styled.div`padding: 18px 26px 18px; flex: 1; display: flex; flex-direction: column; gap: 14px;`;

const Section = styled.section`margin: 0;`;

const SectionTitle = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 9px;
  .num { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; line-height: 1; letter-spacing: .16em; color: #b14aff; text-transform: uppercase; padding-bottom: 2px; }
  h2 { font-family: 'Space Grotesk', 'Inter', sans-serif; font-weight: 700; font-size: 17px; letter-spacing: -.01em; line-height: 1; color: #0f172a; }
  &::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; margin-bottom: 5px; }
`;

const Highlights = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;`;

const Highlight = styled.div`
  background: linear-gradient(135deg, #f8fafc, #fff);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 11px 13px;
  position: relative;
  overflow: hidden;
  &::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: linear-gradient(135deg, #00f0ff, #b14aff); }
  .n {
    font-family: 'Space Grotesk', 'Inter', sans-serif; font-weight: 700; font-size: 20px; line-height: 1;
    background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 4px;
  }
  .l { font-family: 'JetBrains Mono', monospace; font-size: 8.5px; letter-spacing: .1em; color: #475569; text-transform: uppercase; line-height: 1.3; }
`;

const Projects = styled.div`display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;`;

const Project = styled.article`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 11px 12px 10px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%); }
  .project-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; gap: 6px; }
  .project-glyph {
    font-family: 'Space Grotesk', 'Inter', sans-serif; font-weight: 700; font-size: 10.5px; letter-spacing: .04em;
    background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    text-transform: uppercase;
  }
  h3 { font-family: 'Space Grotesk', 'Inter', sans-serif; font-weight: 700; font-size: 12px; color: #0f172a; line-height: 1.25; letter-spacing: -.01em; margin-bottom: 3px; }
  .meta { font-family: 'JetBrains Mono', monospace; font-size: 8.5px; color: #b14aff; letter-spacing: .02em; margin-bottom: 5px; }
  p { font-size: 9.5px; line-height: 1.5; color: #0f172a; margin-bottom: 7px; flex: 1; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag { font-family: 'JetBrains Mono', monospace; font-size: 7.5px; padding: 2px 6px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 999px; color: #7c3aed; }
`;

/* Closing tile in the Featured Work grid — signals more shipped work exists beyond
   what's individually listed, instead of a Nth real project card. */
const MoreProjects = styled.div`
  background: #fafbff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 11px 12px 10px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 5px;
  &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%); }
  .n {
    font-family: 'Space Grotesk', 'Inter', sans-serif; font-weight: 700; font-size: 24px;
    background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .l { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: .08em; color: #475569; text-transform: uppercase; line-height: 1.3; }
`;

const PIN_COLORS = {
  live: { color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  internal: { color: '#0891b2', bg: '#cffafe', border: '#67e8f9' },
  shipped: { color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
};

const Pin = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5px;
  letter-spacing: .1em;
  padding: 2px 7px;
  border-radius: 999px;
  text-transform: uppercase;
  color: ${({ $variant }) => PIN_COLORS[$variant].color};
  background: ${({ $variant }) => PIN_COLORS[$variant].bg};
  border: 1px solid ${({ $variant }) => PIN_COLORS[$variant].border};
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

const ColStackGrid = styled.div`display: flex; flex-direction: column; gap: 12px;`;

const SkillWrap = styled.div`
  margin-bottom: 6px;
  .skill-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
  .skill-name { font-size: 9.5px; color: #0f172a; font-weight: 500; }
  .skill-lv { font-family: 'JetBrains Mono', monospace; font-size: 8px; color: #475569; }
  .bar { height: 4px; background: #eef0f5; border-radius: 999px; overflow: hidden; }
  .bar > span { display: block; height: 100%; background: linear-gradient(135deg, #00f0ff, #b14aff); border-radius: 999px; box-shadow: 0 0 6px rgba(0, 240, 255, .4); }
`;

const StackChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  .chip { font-family: 'Inter', sans-serif; font-size: 7px; font-weight: 500; padding: 3px 9px; background: #13131f; color: #e8e9f3; border: 1px solid #26263a; border-radius: 999px; }
`;

const ContactBlock = styled.div`
  background: #07070d;
  color: #e8e9f3;
  border-radius: 12px;
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 14px;
  align-items: center;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 100% 0%, rgba(0, 240, 255, .18), transparent 50%),
      radial-gradient(circle at 0% 100%, rgba(255, 91, 148, .14), transparent 50%);
    pointer-events: none;
  }
  > * { position: relative; z-index: 1; }
  @media (max-width: 760px) { flex-direction: column; }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
  h3 { font-family: 'Space Grotesk', 'Inter', sans-serif; font-size: 13px; font-weight: 700; margin-bottom: 3px; line-height: 1.15; }
  h3 .grad {
    background: linear-gradient(135deg, #00f0ff 0%, #b14aff 50%, #ff5b94 100%);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .sub { font-size: 9px; color: #8b8da3; margin-bottom: 9px; line-height: 1.5; }
`;

const ContactList = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px;`;

const ContactItem = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 9px;
  min-width: 0;
  .l { font-family: 'JetBrains Mono', monospace; font-size: 7.5px; letter-spacing: .14em; color: #00f0ff; text-transform: uppercase; margin-bottom: 1px; }
  .v { color: #e8e9f3; word-break: break-word; line-height: 1.35; }
`;

const QrMini = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: #fff;
  border-radius: 8px;
  img { width: 72px; height: 72px; display: block; }
  .l { font-family: 'JetBrains Mono', monospace; font-size: 7.5px; letter-spacing: .16em; color: #b14aff; text-transform: uppercase; font-weight: 700; }
`;
