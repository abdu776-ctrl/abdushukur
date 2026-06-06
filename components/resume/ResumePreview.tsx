'use client';

import type {
  PersonalInfo, Education, WorkExperience, Skill,
  Award, Certificate, Project, Volunteer, Publication, ResumeTemplate,
} from '@/types';

interface ResumePreviewProps {
  personal: PersonalInfo;
  education: Education[];
  experience: WorkExperience[];
  skills: Skill[];
  awards: Award[];
  certificates: Certificate[];
  projects: Project[];
  volunteer: Volunteer[];
  publications: Publication[];
  template: ResumeTemplate;
}

type TP = Omit<ResumePreviewProps, 'template'>;

// ─────────────────────────────────────────────────────────────────
// Color configs for the Modern Color Series (8 templates)
// ─────────────────────────────────────────────────────────────────
type CC = { bg: string; accent: string; light: string };
const MC: Record<string, CC> = {
  modern:   { bg: 'linear-gradient(135deg,#4f46e5 0%,#9333ea 100%)', accent: '#4f46e5', light: '#eef2ff' },
  navy:     { bg: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)', accent: '#1d4ed8', light: '#eff6ff' },
  forest:   { bg: 'linear-gradient(135deg,#14532d 0%,#16a34a 100%)', accent: '#15803d', light: '#f0fdf4' },
  crimson:  { bg: 'linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)', accent: '#dc2626', light: '#fef2f2' },
  teal:     { bg: 'linear-gradient(135deg,#134e4a 0%,#0d9488 100%)', accent: '#0d9488', light: '#f0fdfa' },
  amber:    { bg: 'linear-gradient(135deg,#78350f 0%,#d97706 100%)', accent: '#b45309', light: '#fffbeb' },
  midnight: { bg: 'linear-gradient(135deg,#0f0c29 0%,#302b63 100%)', accent: '#6366f1', light: '#eef2ff' },
  rose:     { bg: 'linear-gradient(135deg,#881337 0%,#e11d48 100%)', accent: '#e11d48', light: '#fff1f2' },
};

// ─────────────────────────────────────────────────────────────────
// Main dispatcher
// ─────────────────────────────────────────────────────────────────
export function ResumePreview(props: ResumePreviewProps) {
  const { template, ...rest } = props;
  if (template in MC) return <ModernColor c={MC[template]} {...rest} />;
  if (['korean','korean-blue','korean-compact','korean-premium'].includes(template))
    return <KoreanForm variant={template} {...rest} />;
  if (['classic','oxford','corporate','executive'].includes(template))
    return <ClassicVariant variant={template} {...rest} />;
  if (['minimal','nordic','slate','tokyo'].includes(template))
    return <MinimalVariant variant={template} {...rest} />;
  if (template === 'sidebar')  return <SidebarTemplate {...rest} />;
  if (template === 'dark')     return <DarkTemplate {...rest} />;
  if (template === 'tech')     return <TechTemplate {...rest} />;
  if (template === 'academic') return <AcademicTemplate {...rest} />;
  if (template === 'compact')  return <CompactTemplate {...rest} />;
  return <ModernColor c={MC.modern} {...rest} />;
}

// ─────────────────────────────────────────────────────────────────
// Shared inline helpers
// ─────────────────────────────────────────────────────────────────
const s = {
  row: (style?: React.CSSProperties): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', ...style }),
  col: (gap = 8): React.CSSProperties => ({ display: 'flex', flexDirection: 'column', gap }),
  muted: { color: '#9ca3af' } as React.CSSProperties,
  sub:   { color: '#6b7280' } as React.CSSProperties,
  bold:  { fontWeight: 600, color: '#1f2937' } as React.CSSProperties,
};

function Bar({ level, color }: { level: Skill['level']; color: string }) {
  const w = { beginner: 25, intermediate: 50, advanced: 75, expert: 95 };
  return (
    <div style={{ width: '100%', height: 3, background: '#f3f4f6', borderRadius: 2, marginTop: 2 }}>
      <div style={{ width: `${w[level]}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 1. MODERN COLOR TEMPLATE (modern / navy / forest / crimson / teal / amber / midnight / rose)
// ═══════════════════════════════════════════════════════════════════
function ModernColor({ c, personal, education, experience, skills, awards, certificates, projects, volunteer, publications }: { c: CC } & TP) {
  const sh = (title: string) => (
    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.accent, borderBottom: `1px solid ${c.light}`, paddingBottom: 4, marginBottom: 8 }}>
      {title}
    </div>
  );
  return (
    <div id="resume-preview" style={{ background: '#fff', color: '#111', fontFamily: 'sans-serif', minHeight: 1100, fontSize: 11, lineHeight: 1.5 }}>
      {/* Header */}
      <div style={{ background: c.bg, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
        {personal.photo
          ? <img src={personal.photo} alt="" style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
          : <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 700, flexShrink: 0 }}>
              {personal.fullNameKorean?.[0] || personal.fullName?.[0] || '?'}
            </div>
        }
        <div style={{ color: '#fff', flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            {personal.fullName || 'Your Name'}
            {personal.fullNameKorean && <span style={{ opacity: 0.75, marginLeft: 8, fontSize: 15, fontWeight: 400 }}>({personal.fullNameKorean})</span>}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6, opacity: 0.88, fontSize: 10 }}>
            {personal.email && <span>✉ {personal.email}</span>}
            {personal.phone && <span>☎ {personal.phone}</span>}
            {personal.address && <span>📍 {personal.address}</span>}
            {personal.nationality && <span>🌍 {personal.nationality}</span>}
          </div>
        </div>
      </div>

      {/* 2-col body */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, padding: '24px 32px 32px' }}>
        {/* Left sidebar */}
        <div style={s.col(20)}>
          {skills.length > 0 && <div>
            {sh('Skills')}
            <div style={s.col(8)}>
              {skills.map((sk) => (
                <div key={sk.id}>
                  <div style={s.row()}>
                    <span style={{ fontWeight: 500, color: '#374151' }}>{sk.name || 'Skill'}</span>
                    <span style={{ ...s.muted, fontSize: 9, textTransform: 'capitalize' }}>{sk.level}</span>
                  </div>
                  <Bar level={sk.level} color={c.accent} />
                </div>
              ))}
            </div>
          </div>}

          {certificates.some((x) => x.name) && <div>
            {sh('Certificates')}
            <div style={s.col(6)}>
              {certificates.filter((x) => x.name).map((cert) => (
                <div key={cert.id}>
                  <div style={{ fontWeight: 500, color: '#374151' }}>{cert.name}</div>
                  <div style={{ ...s.muted, fontSize: 9 }}>{cert.issuer}{cert.score ? ` · ${cert.score}` : ''}</div>
                  <div style={{ ...s.muted, fontSize: 9 }}>{cert.date}</div>
                </div>
              ))}
            </div>
          </div>}

          {awards.some((x) => x.title) && <div>
            {sh('Awards')}
            <div style={s.col(6)}>
              {awards.filter((x) => x.title).map((a) => (
                <div key={a.id}>
                  <div style={{ fontWeight: 500, color: '#374151' }}>{a.title}</div>
                  <div style={{ ...s.muted, fontSize: 9 }}>{a.organization} · {a.date}</div>
                </div>
              ))}
            </div>
          </div>}

          {(personal.dateOfBirth || personal.nationality) && <div>
            {sh('Details')}
            <div style={{ ...s.col(4), ...s.sub }}>
              {personal.dateOfBirth && <span>📅 {personal.dateOfBirth}</span>}
              {personal.nationality && <span>🌍 {personal.nationality}</span>}
            </div>
          </div>}
        </div>

        {/* Right main */}
        <div style={s.col(20)}>
          {education.some((e) => e.institution) && <div>
            {sh('Education')}
            <div style={s.col(10)}>
              {education.filter((e) => e.institution).map((edu) => (
                <div key={edu.id}>
                  <div style={s.row()}>
                    <div>
                      <div style={s.bold}>{edu.institution}</div>
                      <div style={s.sub}>{edu.degree}{edu.field && ` — ${edu.field}`}</div>
                    </div>
                    <span style={{ ...s.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>{edu.startDate} — {edu.endDate || 'Present'}</span>
                  </div>
                  {edu.gpa && <div style={s.muted}>GPA: {edu.gpa}</div>}
                </div>
              ))}
            </div>
          </div>}

          {experience.some((e) => e.company) && <div>
            {sh('Experience')}
            <div style={s.col(12)}>
              {experience.filter((e) => e.company).map((exp) => (
                <div key={exp.id}>
                  <div style={s.row()}>
                    <div>
                      <div style={s.bold}>{exp.position}</div>
                      <div style={s.sub}>{exp.company}</div>
                    </div>
                    <span style={{ ...s.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  {exp.description && <div style={{ ...s.sub, marginTop: 4 }}>{exp.description}</div>}
                </div>
              ))}
            </div>
          </div>}

          {projects.some((p) => p.title) && <div>
            {sh('Projects')}
            <div style={s.col(10)}>
              {projects.filter((p) => p.title).map((proj) => (
                <div key={proj.id}>
                  <div style={s.row()}>
                    <div>
                      <div style={s.bold}>{proj.title}</div>
                      <div style={s.sub}>{proj.role}</div>
                      {proj.technologies && <div style={{ ...s.muted, fontSize: 9 }}>{proj.technologies}</div>}
                    </div>
                    <span style={{ ...s.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>{proj.startDate}{proj.endDate || proj.current ? ` — ${proj.current ? 'Present' : proj.endDate}` : ''}</span>
                  </div>
                  {proj.description && <div style={{ ...s.sub, marginTop: 4 }}>{proj.description}</div>}
                  {proj.url && <div style={{ color: c.accent, fontSize: 9, marginTop: 2 }}>{proj.url}</div>}
                </div>
              ))}
            </div>
          </div>}

          {volunteer.some((v) => v.organization) && <div>
            {sh('Volunteer')}
            <div style={s.col(8)}>
              {volunteer.filter((v) => v.organization).map((vol) => (
                <div key={vol.id} style={s.row()}>
                  <div>
                    <div style={s.bold}>{vol.role}</div>
                    <div style={s.sub}>{vol.organization}</div>
                  </div>
                  <span style={{ ...s.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>{vol.startDate} — {vol.current ? 'Present' : vol.endDate}</span>
                </div>
              ))}
            </div>
          </div>}

          {publications.some((p) => p.title) && <div>
            {sh('Publications')}
            <div style={s.col(8)}>
              {publications.filter((p) => p.title).map((pub) => (
                <div key={pub.id}>
                  <div style={s.bold}>{pub.title}</div>
                  <div style={s.sub}>{pub.publisher} · {pub.date}</div>
                  {pub.authors && <div style={{ ...s.muted, fontSize: 9 }}>{pub.authors}</div>}
                  {pub.doi && <div style={{ color: c.accent, fontSize: 9 }}>{pub.doi}</div>}
                </div>
              ))}
            </div>
          </div>}

          {!education.some((e) => e.institution) && !experience.some((e) => e.company) && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Fill in your information to see the preview</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. KOREAN FORM TEMPLATE (korean / korean-blue / korean-compact / korean-premium)
// ═══════════════════════════════════════════════════════════════════
function KoreanForm({ variant, personal, education, experience, skills, awards, certificates, projects, volunteer, publications }: { variant: string } & TP) {
  const isBlue    = variant === 'korean-blue';
  const isCompact = variant === 'korean-compact';
  const isPremium = variant === 'korean-premium';

  const accent   = isBlue ? '#1d4ed8' : isPremium ? '#7c3aed' : '#1f2937';
  const thBg     = isBlue ? '#eff6ff' : isPremium ? '#f5f3ff' : '#f9fafb';
  const border   = isPremium ? '1.5px solid #e5e7eb' : '1px solid #d1d5db';
  const fontFamily = 'Noto Sans KR, sans-serif';

  const td = (content: React.ReactNode, isHeader = false, colSpan = 1): React.ReactNode => (
    <td style={{ border, padding: '5px 8px', background: isHeader ? thBg : '#fff', fontWeight: isHeader ? 600 : 400, whiteSpace: isHeader ? 'nowrap' : undefined, colSpan: undefined } as React.CSSProperties}
      colSpan={colSpan}>
      {content}
    </td>
  );

  return (
    <div id="resume-preview" style={{ background: '#fff', color: '#111', fontFamily, minHeight: 1100, fontSize: 10, lineHeight: 1.8, padding: 32 }}>
      <div style={{ textAlign: 'center', borderBottom: `2px solid ${accent}`, paddingBottom: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.3em', color: accent }}>이 력 서</h1>
      </div>

      {/* Personal info row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {/* Photo (not shown in compact) */}
        {!isCompact && (
          <div style={{ width: 108, height: 140, border, flexShrink: 0, overflow: 'hidden', borderRadius: isPremium ? 4 : 0 }}>
            {personal.photo
              ? <img src={personal.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', textAlign: 'center', fontSize: 9 }}>증명사진<br/>3×4cm</div>
            }
          </div>
        )}

        <table style={{ flex: 1, borderCollapse: 'collapse', fontSize: 10 }}>
          <tbody>
            <tr>
              {td('성 명', true)}{td(personal.fullName)}
              {td('한국어 이름', true)}{td(personal.fullNameKorean)}
            </tr>
            <tr>
              {td('생년월일', true)}{td(personal.dateOfBirth)}
              {td('국 적', true)}{td(personal.nationality)}
            </tr>
            <tr>{td('연 락 처', true)}<td colSpan={3} style={{ border, padding: '5px 8px' }}>{personal.phone}</td></tr>
            <tr>{td('이 메 일', true)}<td colSpan={3} style={{ border, padding: '5px 8px' }}>{personal.email}</td></tr>
            <tr>{td('주 소', true)}<td colSpan={3} style={{ border, padding: '5px 8px' }}>{personal.address}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Education */}
      {education.some((e) => e.institution) && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 6, color: accent }}>학 력 사 항</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ background: thBg }}>
                {['기간','학교명','전공','학위','학점'].map((h) => (
                  <th key={h} style={{ border, padding: '5px 8px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {education.filter((e) => e.institution).map((edu) => (
                <tr key={edu.id}>
                  <td style={{ border, padding: '5px 8px', whiteSpace: 'nowrap' }}>{edu.startDate} ~ {edu.endDate || '현재'}</td>
                  <td style={{ border, padding: '5px 8px' }}>{edu.institution}</td>
                  <td style={{ border, padding: '5px 8px' }}>{edu.field}</td>
                  <td style={{ border, padding: '5px 8px' }}>{edu.degree}</td>
                  <td style={{ border, padding: '5px 8px' }}>{edu.gpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Experience */}
      {experience.some((e) => e.company) && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 6, color: accent }}>경 력 사 항</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ background: thBg }}>
                {['기간','회사명','직위','업무내용'].map((h) => (
                  <th key={h} style={{ border, padding: '5px 8px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {experience.filter((e) => e.company).map((exp) => (
                <tr key={exp.id}>
                  <td style={{ border, padding: '5px 8px', whiteSpace: 'nowrap' }}>{exp.startDate} ~ {exp.current ? '현재' : exp.endDate}</td>
                  <td style={{ border, padding: '5px 8px' }}>{exp.company}</td>
                  <td style={{ border, padding: '5px 8px' }}>{exp.position}</td>
                  <td style={{ border, padding: '5px 8px' }}>{exp.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 6, color: accent }}>자격증 및 기술</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <tbody>
              {skills.map((sk) => (
                <tr key={sk.id}>
                  <td style={{ border, padding: '5px 8px', width: '35%' }}>{sk.name}</td>
                  <td style={{ border, padding: '5px 8px', textTransform: 'capitalize' }}>{sk.level}</td>
                  <td style={{ border, padding: '5px 8px' }}>{sk.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Awards */}
      {awards.some((a) => a.title) && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 6, color: accent }}>수 상 / 장 학 금</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead><tr style={{ background: thBg }}>{['수상명','기관','종류','날짜'].map((h) => <th key={h} style={{ border, padding: '5px 8px', fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {awards.filter((a) => a.title).map((a) => (
                <tr key={a.id}>
                  <td style={{ border, padding: '5px 8px' }}>{a.title}</td>
                  <td style={{ border, padding: '5px 8px' }}>{a.organization}</td>
                  <td style={{ border, padding: '5px 8px' }}>{a.type === 'award' ? '수상' : a.type === 'scholarship' ? '장학금' : '표창'}</td>
                  <td style={{ border, padding: '5px 8px', whiteSpace: 'nowrap' }}>{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Certificates */}
      {certificates.some((c) => c.name) && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 6, color: accent }}>자 격 증 / 면 허</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead><tr style={{ background: thBg }}>{['자격증명','발급기관','점수/급수','취득일'].map((h) => <th key={h} style={{ border, padding: '5px 8px', fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {certificates.filter((c) => c.name).map((cert) => (
                <tr key={cert.id}>
                  <td style={{ border, padding: '5px 8px' }}>{cert.name}</td>
                  <td style={{ border, padding: '5px 8px' }}>{cert.issuer}</td>
                  <td style={{ border, padding: '5px 8px' }}>{cert.score}</td>
                  <td style={{ border, padding: '5px 8px', whiteSpace: 'nowrap' }}>{cert.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Projects */}
      {projects.some((p) => p.title) && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 6, color: accent }}>프 로 젝 트 경 험</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead><tr style={{ background: thBg }}>{['기간','프로젝트명','역할','기술/내용'].map((h) => <th key={h} style={{ border, padding: '5px 8px', fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {projects.filter((p) => p.title).map((proj) => (
                <tr key={proj.id}>
                  <td style={{ border, padding: '5px 8px', whiteSpace: 'nowrap' }}>{proj.startDate} ~ {proj.current ? '현재' : proj.endDate}</td>
                  <td style={{ border, padding: '5px 8px' }}>{proj.title}</td>
                  <td style={{ border, padding: '5px 8px' }}>{proj.role}</td>
                  <td style={{ border, padding: '5px 8px' }}>{proj.technologies}{proj.description ? ` / ${proj.description}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Volunteer */}
      {volunteer.some((v) => v.organization) && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 6, color: accent }}>봉 사 활 동</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead><tr style={{ background: thBg }}>{['기간','기관명','역할','내용'].map((h) => <th key={h} style={{ border, padding: '5px 8px', fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {volunteer.filter((v) => v.organization).map((vol) => (
                <tr key={vol.id}>
                  <td style={{ border, padding: '5px 8px', whiteSpace: 'nowrap' }}>{vol.startDate} ~ {vol.current ? '현재' : vol.endDate}</td>
                  <td style={{ border, padding: '5px 8px' }}>{vol.organization}</td>
                  <td style={{ border, padding: '5px 8px' }}>{vol.role}</td>
                  <td style={{ border, padding: '5px 8px' }}>{vol.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Publications */}
      {publications.some((p) => p.title) && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 6, color: accent }}>연 구 실 적 / 논 문</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead><tr style={{ background: thBg }}>{['종류','논문제목','저널/학회','발표일'].map((h) => <th key={h} style={{ border, padding: '5px 8px', fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {publications.filter((p) => p.title).map((pub) => (
                <tr key={pub.id}>
                  <td style={{ border, padding: '5px 8px', whiteSpace: 'nowrap' }}>{pub.type === 'thesis' ? '학위논문' : pub.type === 'journal' ? '학술논문' : '프로시딩'}</td>
                  <td style={{ border, padding: '5px 8px' }}>{pub.title}</td>
                  <td style={{ border, padding: '5px 8px' }}>{pub.publisher}</td>
                  <td style={{ border, padding: '5px 8px', whiteSpace: 'nowrap' }}>{pub.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 32, textAlign: 'center', fontSize: 10, color: '#6b7280' }}>
        <p>위 사항은 사실과 틀림없음을 확인합니다.</p>
        <p style={{ marginTop: 4 }}>날 짜: {new Date().toLocaleDateString('ko-KR')}</p>
        <p style={{ marginTop: 16 }}>지원자: {personal.fullName} &nbsp;&nbsp;&nbsp; (서 명)</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. CLASSIC VARIANT TEMPLATE (classic / oxford / corporate / executive)
// ═══════════════════════════════════════════════════════════════════
function ClassicVariant({ variant, personal, education, experience, skills, awards, certificates, projects, volunteer, publications }: { variant: string } & TP) {
  const cfg = {
    classic:   { accent: '#1f2937', rule: '#1f2937', nameSize: 28, serif: false, gold: false },
    oxford:    { accent: '#1e3a8a', rule: '#1e3a8a', nameSize: 26, serif: true,  gold: false },
    corporate: { accent: '#1d4ed8', rule: '#1d4ed8', nameSize: 26, serif: false, gold: false },
    executive: { accent: '#92400e', rule: '#78350f', nameSize: 26, serif: false, gold: true  },
  }[variant] ?? { accent: '#1f2937', rule: '#1f2937', nameSize: 28, serif: false, gold: false };

  const ff = cfg.serif ? 'Georgia, serif' : 'sans-serif';

  const sec = (title: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, height: 1.5, background: cfg.rule }} />
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: cfg.accent }}>{title}</span>
        <div style={{ flex: 1, height: 1.5, background: cfg.rule }} />
      </div>
    </div>
  );

  return (
    <div id="resume-preview" style={{ background: '#fff', color: '#111', fontFamily: ff, minHeight: 1100, fontSize: 11, lineHeight: 1.6, padding: 40 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {cfg.gold && <div style={{ height: 3, background: 'linear-gradient(90deg,#92400e,#d97706,#92400e)', marginBottom: 12, borderRadius: 2 }} />}
        <h1 style={{ fontSize: cfg.nameSize, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: cfg.accent, margin: 0 }}>
          {personal.fullName || 'Your Name'}
        </h1>
        {personal.fullNameKorean && <p style={{ color: '#6b7280', fontSize: 14, marginTop: 2 }}>{personal.fullNameKorean}</p>}
        <div style={{ height: cfg.gold ? 2 : 1, background: cfg.rule, margin: '10px auto', width: cfg.gold ? '60%' : '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, color: '#6b7280', fontSize: 10, flexWrap: 'wrap' }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>|</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.address && <span>|</span>}
          {personal.address && <span>{personal.address}</span>}
          {personal.nationality && <span>|</span>}
          {personal.nationality && <span>{personal.nationality}</span>}
        </div>
        {cfg.gold && <div style={{ height: 3, background: 'linear-gradient(90deg,#92400e,#d97706,#92400e)', marginTop: 12, borderRadius: 2 }} />}
      </div>

      {[
        education.some((e) => e.institution) && { title: 'Education', content: education.filter((e) => e.institution).map((edu) => (
          <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div><div style={{ fontWeight: 600 }}>{edu.institution}</div><div style={s.sub}>{edu.degree}{edu.field && `, ${edu.field}`}{edu.gpa && ` · GPA ${edu.gpa}`}</div></div>
            <span style={s.muted}>{edu.startDate} – {edu.endDate || 'Present'}</span>
          </div>
        ))},
        experience.some((e) => e.company) && { title: 'Experience', content: experience.filter((e) => e.company).map((exp) => (
          <div key={exp.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>{exp.position} — {exp.company}</span>
              <span style={s.muted}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
            </div>
            {exp.description && <div style={s.sub}>{exp.description}</div>}
          </div>
        ))},
        projects.some((p) => p.title) && { title: 'Projects', content: projects.filter((p) => p.title).map((proj) => (
          <div key={proj.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>{proj.title} — {proj.role}</span>
              <span style={s.muted}>{proj.startDate} – {proj.current ? 'Present' : proj.endDate}</span>
            </div>
            {proj.technologies && <div style={{ ...s.muted, fontSize: 9 }}>{proj.technologies}</div>}
            {proj.description && <div style={s.sub}>{proj.description}</div>}
          </div>
        ))},
        awards.some((a) => a.title) && { title: 'Awards & Scholarships', content: awards.filter((a) => a.title).map((a) => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div><span style={{ fontWeight: 600 }}>{a.title}</span><span style={{ ...s.sub, marginLeft: 6 }}>— {a.organization}</span></div>
            <span style={s.muted}>{a.date}</span>
          </div>
        ))},
        certificates.some((c) => c.name) && { title: 'Certificates', content: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
            {certificates.filter((c) => c.name).map((cert) => (
              <span key={cert.id} style={{ color: '#374151' }}>{cert.name}{cert.score ? ` (${cert.score})` : ''}</span>
            ))}
          </div>
        )},
        volunteer.some((v) => v.organization) && { title: 'Volunteer', content: volunteer.filter((v) => v.organization).map((vol) => (
          <div key={vol.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span><span style={{ fontWeight: 600 }}>{vol.role}</span> — {vol.organization}</span>
            <span style={s.muted}>{vol.startDate} – {vol.current ? 'Present' : vol.endDate}</span>
          </div>
        ))},
        publications.some((p) => p.title) && { title: 'Publications', content: publications.filter((p) => p.title).map((pub) => (
          <div key={pub.id} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>{pub.title}</div>
            <div style={s.sub}>{pub.publisher} · {pub.date}{pub.authors ? ` · ${pub.authors}` : ''}</div>
          </div>
        ))},
        skills.length > 0 && { title: 'Skills', content: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px' }}>
            {skills.map((sk) => (
              <span key={sk.id} style={{ padding: '2px 8px', border: `1px solid ${cfg.accent}`, borderRadius: 2, color: '#374151', fontSize: 10 }}>{sk.name || 'Skill'}</span>
            ))}
          </div>
        )},
      ].filter(Boolean).map((item: any, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          {sec(item.title)}
          {item.content}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4. MINIMAL VARIANT TEMPLATE (minimal / nordic / slate / tokyo)
// ═══════════════════════════════════════════════════════════════════
function MinimalVariant({ variant, personal, education, experience, skills, awards, certificates, projects, volunteer, publications }: { variant: string } & TP) {
  const cfg = {
    minimal: { accent: '#374151', bg: '#fff',    pad: 40, secColor: '#9ca3af', dot: false, leftBorder: false },
    nordic:  { accent: '#94a3b8', bg: '#fafafa', pad: 48, secColor: '#94a3b8', dot: false, leftBorder: false },
    slate:   { accent: '#475569', bg: '#fff',    pad: 40, secColor: '#64748b', dot: false, leftBorder: true  },
    tokyo:   { accent: '#0ea5e9', bg: '#fff',    pad: 40, secColor: '#0ea5e9', dot: true,  leftBorder: false },
  }[variant] ?? { accent: '#374151', bg: '#fff', pad: 40, secColor: '#9ca3af', dot: false, leftBorder: false };

  const sec = (title: string) => (
    <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
      {cfg.dot && <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.accent, flexShrink: 0 }} />}
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: cfg.secColor }}>{title}</span>
      {!cfg.dot && <div style={{ flex: 1, height: 0.5, background: '#e5e7eb' }} />}
    </div>
  );

  const wrap: React.CSSProperties = cfg.leftBorder ? { borderLeft: `2px solid ${cfg.accent}`, paddingLeft: 12 } : {};

  return (
    <div id="resume-preview" style={{ background: cfg.bg, color: '#111', fontFamily: 'sans-serif', minHeight: 1100, fontSize: 11, lineHeight: 1.7, padding: cfg.pad }}>
      {/* Name block */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 34, fontWeight: 300, letterSpacing: '-0.02em', color: '#111', margin: 0 }}>{personal.fullName || 'Your Name'}</h1>
        {personal.fullNameKorean && <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{personal.fullNameKorean}</p>}
        <div style={{ display: 'flex', gap: 16, color: '#9ca3af', fontSize: 10, marginTop: 8, flexWrap: 'wrap' }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.address && <span>{personal.address}</span>}
          {personal.nationality && <span>{personal.nationality}</span>}
        </div>
      </div>

      <div style={s.col(24)}>
        {education.some((e) => e.institution) && <div style={wrap}>
          {sec('Education')}
          <div style={s.col(10)}>
            {education.filter((e) => e.institution).map((edu) => (
              <div key={edu.id}>
                <div style={{ fontWeight: 500, color: '#1f2937' }}>{edu.institution}</div>
                <div style={s.sub}>{edu.degree}{edu.field && `, ${edu.field}`} · {edu.startDate}–{edu.endDate || 'Present'}</div>
                {edu.gpa && <div style={s.muted}>GPA: {edu.gpa}</div>}
              </div>
            ))}
          </div>
        </div>}

        {experience.some((e) => e.company) && <div style={wrap}>
          {sec('Experience')}
          <div style={s.col(12)}>
            {experience.filter((e) => e.company).map((exp) => (
              <div key={exp.id}>
                <div style={{ fontWeight: 500, color: '#1f2937' }}>{exp.position}</div>
                <div style={s.sub}>{exp.company} · {exp.startDate}–{exp.current ? 'Present' : exp.endDate}</div>
                {exp.description && <div style={{ ...s.sub, marginTop: 2 }}>{exp.description}</div>}
              </div>
            ))}
          </div>
        </div>}

        {projects.some((p) => p.title) && <div style={wrap}>
          {sec('Projects')}
          <div style={s.col(10)}>
            {projects.filter((p) => p.title).map((proj) => (
              <div key={proj.id}>
                <div style={{ fontWeight: 500, color: '#1f2937' }}>{proj.title}</div>
                <div style={s.sub}>{proj.role} · {proj.startDate}–{proj.current ? 'Present' : proj.endDate}</div>
                {proj.technologies && <div style={s.muted}>{proj.technologies}</div>}
                {proj.description && <div style={s.sub}>{proj.description}</div>}
              </div>
            ))}
          </div>
        </div>}

        {awards.some((a) => a.title) && <div style={wrap}>
          {sec('Awards & Scholarships')}
          <div style={s.col(6)}>
            {awards.filter((a) => a.title).map((a) => (
              <div key={a.id}>
                <span style={{ fontWeight: 500, color: '#1f2937' }}>{a.title}</span>
                <span style={s.sub}> · {a.organization} · {a.date}</span>
              </div>
            ))}
          </div>
        </div>}

        {certificates.some((c) => c.name) && <div style={wrap}>
          {sec('Certificates')}
          <div style={s.sub}>{certificates.filter((c) => c.name).map((c) => `${c.name}${c.score ? ` (${c.score})` : ''}`).join(' · ')}</div>
        </div>}

        {volunteer.some((v) => v.organization) && <div style={wrap}>
          {sec('Volunteer')}
          <div style={s.col(6)}>
            {volunteer.filter((v) => v.organization).map((vol) => (
              <div key={vol.id}>
                <span style={{ fontWeight: 500, color: '#1f2937' }}>{vol.role}</span>
                <span style={s.sub}> · {vol.organization} · {vol.startDate}–{vol.current ? 'Present' : vol.endDate}</span>
              </div>
            ))}
          </div>
        </div>}

        {publications.some((p) => p.title) && <div style={wrap}>
          {sec('Publications')}
          <div style={s.col(8)}>
            {publications.filter((p) => p.title).map((pub) => (
              <div key={pub.id}>
                <div style={{ fontWeight: 500, color: '#1f2937' }}>{pub.title}</div>
                <div style={s.sub}>{pub.publisher} · {pub.date}{pub.authors ? ` · ${pub.authors}` : ''}</div>
              </div>
            ))}
          </div>
        </div>}

        {skills.length > 0 && <div style={wrap}>
          {sec('Skills')}
          <div style={s.sub}>{skills.map((sk) => sk.name).filter(Boolean).join(' · ')}</div>
        </div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5. SIDEBAR TEMPLATE — colored left panel with photo
// ═══════════════════════════════════════════════════════════════════
function SidebarTemplate({ personal, education, experience, skills, awards, certificates, projects, volunteer, publications }: TP) {
  const bg = 'linear-gradient(180deg,#4f46e5 0%,#7c3aed 100%)';
  const sh = (title: string) => (
    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', opacity: 0.7, marginBottom: 8, marginTop: 16 }}>{title}</div>
  );
  const rh = (title: string) => (
    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4f46e5', borderBottom: '1px solid #e0e7ff', paddingBottom: 4, marginBottom: 8, marginTop: 16 }}>{title}</div>
  );

  return (
    <div id="resume-preview" style={{ display: 'flex', minHeight: 1100, fontFamily: 'sans-serif', fontSize: 11 }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: bg, color: '#fff', padding: '32px 20px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Photo */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {personal.photo
            ? <img src={personal.photo} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', display: 'block', margin: '0 auto' }} />
            : <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto' }}>
                {personal.fullNameKorean?.[0] || personal.fullName?.[0] || '?'}
              </div>
          }
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700 }}>{personal.fullName || 'Your Name'}</div>
          {personal.fullNameKorean && <div style={{ fontSize: 11, opacity: 0.75 }}>{personal.fullNameKorean}</div>}
        </div>

        {/* Contact */}
        {sh('Contact')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, opacity: 0.9 }}>
          {personal.email && <span>✉ {personal.email}</span>}
          {personal.phone && <span>☎ {personal.phone}</span>}
          {personal.address && <span>📍 {personal.address}</span>}
          {personal.dateOfBirth && <span>📅 {personal.dateOfBirth}</span>}
          {personal.nationality && <span>🌍 {personal.nationality}</span>}
        </div>

        {/* Skills */}
        {skills.length > 0 && <>
          {sh('Skills')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {skills.map((sk) => (
              <div key={sk.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                  <span>{sk.name}</span>
                  <span style={{ opacity: 0.65, fontSize: 9 }}>{sk.level}</span>
                </div>
                <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                  <div style={{ width: `${{ beginner: 25, intermediate: 50, advanced: 75, expert: 95 }[sk.level]}%`, height: '100%', background: '#fff', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* Certs */}
        {certificates.some((c) => c.name) && <>
          {sh('Certificates')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, opacity: 0.9 }}>
            {certificates.filter((c) => c.name).map((cert) => (
              <div key={cert.id}>{cert.name}{cert.score ? ` · ${cert.score}` : ''}</div>
            ))}
          </div>
        </>}

        {/* Awards */}
        {awards.some((a) => a.title) && <>
          {sh('Awards')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, opacity: 0.9 }}>
            {awards.filter((a) => a.title).map((a) => (
              <div key={a.id}>{a.title}</div>
            ))}
          </div>
        </>}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px 28px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {education.some((e) => e.institution) && <>
          {rh('Education')}
          <div style={s.col(10)}>
            {education.filter((e) => e.institution).map((edu) => (
              <div key={edu.id}>
                <div style={s.row()}>
                  <div><div style={s.bold}>{edu.institution}</div><div style={s.sub}>{edu.degree}{edu.field && ` — ${edu.field}`}</div></div>
                  <span style={{ ...s.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>{edu.startDate} — {edu.endDate || 'Present'}</span>
                </div>
              </div>
            ))}
          </div>
        </>}

        {experience.some((e) => e.company) && <>
          {rh('Experience')}
          <div style={s.col(12)}>
            {experience.filter((e) => e.company).map((exp) => (
              <div key={exp.id}>
                <div style={s.row()}>
                  <div><div style={s.bold}>{exp.position}</div><div style={s.sub}>{exp.company}</div></div>
                  <span style={{ ...s.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                {exp.description && <div style={{ ...s.sub, marginTop: 4 }}>{exp.description}</div>}
              </div>
            ))}
          </div>
        </>}

        {projects.some((p) => p.title) && <>
          {rh('Projects')}
          <div style={s.col(10)}>
            {projects.filter((p) => p.title).map((proj) => (
              <div key={proj.id}>
                <div style={s.row()}>
                  <div><div style={s.bold}>{proj.title}</div><div style={s.sub}>{proj.role}{proj.technologies ? ` · ${proj.technologies}` : ''}</div></div>
                  <span style={{ ...s.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>{proj.startDate}{proj.endDate || proj.current ? ` — ${proj.current ? 'Present' : proj.endDate}` : ''}</span>
                </div>
                {proj.description && <div style={{ ...s.sub, marginTop: 4 }}>{proj.description}</div>}
              </div>
            ))}
          </div>
        </>}

        {volunteer.some((v) => v.organization) && <>
          {rh('Volunteer')}
          <div style={s.col(8)}>
            {volunteer.filter((v) => v.organization).map((vol) => (
              <div key={vol.id} style={s.row()}>
                <div><div style={s.bold}>{vol.role}</div><div style={s.sub}>{vol.organization}</div></div>
                <span style={{ ...s.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>{vol.startDate} — {vol.current ? 'Present' : vol.endDate}</span>
              </div>
            ))}
          </div>
        </>}

        {publications.some((p) => p.title) && <>
          {rh('Publications')}
          <div style={s.col(8)}>
            {publications.filter((p) => p.title).map((pub) => (
              <div key={pub.id}>
                <div style={s.bold}>{pub.title}</div>
                <div style={s.sub}>{pub.publisher} · {pub.date}{pub.authors ? ` · ${pub.authors}` : ''}</div>
              </div>
            ))}
          </div>
        </>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 6. DARK TEMPLATE
// ═══════════════════════════════════════════════════════════════════
function DarkTemplate({ personal, education, experience, skills, awards, certificates, projects, volunteer, publications }: TP) {
  const BG = '#0f0f1a', CARD = '#1a1a2e', ACC = '#6366f1', MUT = '#64748b', SUB = '#94a3b8', TXT = '#e2e8f0';
  const sh = (title: string) => (
    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: ACC, marginBottom: 10, marginTop: 20, paddingBottom: 4, borderBottom: `1px solid #1e1e3a` }}>{title}</div>
  );
  return (
    <div id="resume-preview" style={{ background: BG, color: TXT, fontFamily: 'sans-serif', minHeight: 1100, fontSize: 11, lineHeight: 1.6, padding: 0 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${CARD},#16213e)`, padding: '32px', borderBottom: `1px solid #1e1e3a` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {personal.photo
            ? <img src={personal.photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ACC}`, flexShrink: 0 }} />
            : <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${ACC}33`, border: `2px solid ${ACC}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: ACC, flexShrink: 0 }}>
                {personal.fullNameKorean?.[0] || personal.fullName?.[0] || '?'}
              </div>
          }
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, background: `linear-gradient(90deg,${ACC},#a855f7)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {personal.fullName || 'Your Name'}
            </h1>
            {personal.fullNameKorean && <div style={{ color: SUB, fontSize: 12 }}>{personal.fullNameKorean}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 6, color: MUT, fontSize: 10, flexWrap: 'wrap' }}>
              {personal.email && <span>{personal.email}</span>}
              {personal.phone && <span>{personal.phone}</span>}
              {personal.address && <span>{personal.address}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0 }}>
        {/* Left */}
        <div style={{ background: CARD, padding: '20px 20px 32px', borderRight: '1px solid #1e1e3a' }}>
          {sh('Skills')}
          <div style={s.col(8)}>
            {skills.map((sk) => (
              <div key={sk.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: TXT, fontSize: 10 }}>
                  <span>{sk.name}</span>
                  <span style={{ color: MUT, fontSize: 9 }}>{sk.level}</span>
                </div>
                <div style={{ width: '100%', height: 2, background: '#1e1e3a', borderRadius: 2, marginTop: 2 }}>
                  <div style={{ width: `${{ beginner: 25, intermediate: 50, advanced: 75, expert: 95 }[sk.level]}%`, height: '100%', background: ACC, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
          {certificates.some((c) => c.name) && <>
            {sh('Certs')}
            <div style={{ ...s.col(4), color: SUB, fontSize: 10 }}>
              {certificates.filter((c) => c.name).map((cert) => <div key={cert.id}>{cert.name}</div>)}
            </div>
          </>}
          {awards.some((a) => a.title) && <>
            {sh('Awards')}
            <div style={{ ...s.col(4), color: SUB, fontSize: 10 }}>
              {awards.filter((a) => a.title).map((a) => <div key={a.id}>{a.title}</div>)}
            </div>
          </>}
        </div>

        {/* Right */}
        <div style={{ padding: '20px 24px 32px', display: 'flex', flexDirection: 'column' }}>
          {education.some((e) => e.institution) && <>
            {sh('Education')}
            <div style={s.col(10)}>
              {education.filter((e) => e.institution).map((edu) => (
                <div key={edu.id}>
                  <div style={s.row()}><div><div style={{ fontWeight: 600, color: TXT }}>{edu.institution}</div><div style={{ color: SUB }}>{edu.degree}{edu.field && ` — ${edu.field}`}</div></div><span style={{ color: MUT, whiteSpace: 'nowrap', marginLeft: 8 }}>{edu.startDate} — {edu.endDate || 'Present'}</span></div>
                </div>
              ))}
            </div>
          </>}
          {experience.some((e) => e.company) && <>
            {sh('Experience')}
            <div style={s.col(12)}>
              {experience.filter((e) => e.company).map((exp) => (
                <div key={exp.id}>
                  <div style={s.row()}><div><div style={{ fontWeight: 600, color: TXT }}>{exp.position}</div><div style={{ color: SUB }}>{exp.company}</div></div><span style={{ color: MUT, whiteSpace: 'nowrap', marginLeft: 8 }}>{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span></div>
                  {exp.description && <div style={{ color: SUB, marginTop: 4 }}>{exp.description}</div>}
                </div>
              ))}
            </div>
          </>}
          {projects.some((p) => p.title) && <>
            {sh('Projects')}
            <div style={s.col(10)}>
              {projects.filter((p) => p.title).map((proj) => (
                <div key={proj.id}>
                  <div style={s.row()}><div><div style={{ fontWeight: 600, color: TXT }}>{proj.title}</div><div style={{ color: SUB }}>{proj.role}{proj.technologies ? ` · ${proj.technologies}` : ''}</div></div><span style={{ color: MUT, whiteSpace: 'nowrap', marginLeft: 8 }}>{proj.startDate}{proj.current ? ' — Present' : proj.endDate ? ` — ${proj.endDate}` : ''}</span></div>
                  {proj.description && <div style={{ color: SUB, marginTop: 4 }}>{proj.description}</div>}
                </div>
              ))}
            </div>
          </>}
          {publications.some((p) => p.title) && <>
            {sh('Publications')}
            <div style={s.col(8)}>
              {publications.filter((p) => p.title).map((pub) => (
                <div key={pub.id}><div style={{ fontWeight: 600, color: TXT }}>{pub.title}</div><div style={{ color: SUB }}>{pub.publisher} · {pub.date}</div></div>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 7. TECH / DEVELOPER TEMPLATE
// ═══════════════════════════════════════════════════════════════════
function TechTemplate({ personal, education, experience, skills, awards, certificates, projects, volunteer, publications }: TP) {
  const BG = '#0d1117', CARD = '#161b22', ACC = '#58a6ff', GRN = '#3fb950', YLW = '#f0883e', TXT = '#c9d1d9', MUT = '#8b949e';
  const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';
  const prompt = (text: string) => <span style={{ color: GRN }}>$ </span>;

  return (
    <div id="resume-preview" style={{ background: BG, color: TXT, fontFamily: mono, minHeight: 1100, fontSize: 11, lineHeight: 1.6 }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: `1px solid #30363d` }}>
        <div style={{ color: MUT, fontSize: 10, marginBottom: 8 }}>{/* comment */}<span style={{ color: '#6e7681' }}>{'// '}</span><span style={{ color: '#8b949e' }}>profile.json</span></div>
        <div style={{ fontSize: 20, fontWeight: 700, color: ACC }}>{personal.fullName || 'dev.name'}</div>
        {personal.fullNameKorean && <div style={{ color: GRN, fontSize: 12 }}>{personal.fullNameKorean}</div>}
        <div style={{ marginTop: 8, display: 'flex', gap: 16, color: MUT, fontSize: 10, flexWrap: 'wrap' }}>
          {personal.email && <span style={{ color: YLW }}>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.address && <span>{personal.address}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 0 }}>
        {/* Left */}
        <div style={{ background: CARD, borderRight: `1px solid #30363d`, padding: '20px 16px 32px' }}>
          <div style={{ color: MUT, fontSize: 9, marginBottom: 8 }}>{'// '}<span style={{ color: YLW }}>tech_stack</span></div>
          <div style={s.col(6)}>
            {skills.map((sk) => (
              <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: GRN, fontSize: 9 }}>▸</span>
                <span style={{ color: TXT, fontSize: 10 }}>{sk.name}</span>
                <span style={{ color: MUT, fontSize: 8, marginLeft: 'auto' }}>{sk.level.slice(0, 3).toUpperCase()}</span>
              </div>
            ))}
          </div>
          {certificates.some((c) => c.name) && <>
            <div style={{ color: MUT, fontSize: 9, marginTop: 16, marginBottom: 8 }}>{'// '}<span style={{ color: YLW }}>certs</span></div>
            <div style={{ ...s.col(4), fontSize: 10 }}>
              {certificates.filter((c) => c.name).map((cert) => <div key={cert.id} style={{ color: ACC }}>{cert.name}</div>)}
            </div>
          </>}
          {awards.some((a) => a.title) && <>
            <div style={{ color: MUT, fontSize: 9, marginTop: 16, marginBottom: 8 }}>{'// '}<span style={{ color: YLW }}>awards</span></div>
            <div style={{ ...s.col(4), fontSize: 10 }}>
              {awards.filter((a) => a.title).map((a) => <div key={a.id} style={{ color: TXT }}>🏆 {a.title}</div>)}
            </div>
          </>}
        </div>

        {/* Right */}
        <div style={{ padding: '20px 24px 32px' }}>
          {education.some((e) => e.institution) && <>
            <div style={{ color: MUT, fontSize: 9, marginBottom: 8 }}>{'// '}<span style={{ color: GRN }}>education</span></div>
            <div style={{ ...s.col(10), marginBottom: 16 }}>
              {education.filter((e) => e.institution).map((edu) => (
                <div key={edu.id} style={{ background: CARD, padding: '8px 12px', borderRadius: 6, border: '1px solid #30363d' }}>
                  <div style={{ color: ACC, fontWeight: 600 }}>{edu.institution}</div>
                  <div style={{ color: TXT, fontSize: 10 }}>{edu.degree}{edu.field && ` / ${edu.field}`}</div>
                  <div style={{ color: MUT, fontSize: 9 }}>{edu.startDate} → {edu.endDate || 'present'}{edu.gpa ? ` · GPA ${edu.gpa}` : ''}</div>
                </div>
              ))}
            </div>
          </>}

          {experience.some((e) => e.company) && <>
            <div style={{ color: MUT, fontSize: 9, marginBottom: 8 }}>{'// '}<span style={{ color: GRN }}>work_experience</span></div>
            <div style={{ ...s.col(10), marginBottom: 16 }}>
              {experience.filter((e) => e.company).map((exp) => (
                <div key={exp.id} style={{ background: CARD, padding: '8px 12px', borderRadius: 6, border: '1px solid #30363d' }}>
                  <div style={{ color: ACC, fontWeight: 600 }}>{exp.position}</div>
                  <div style={{ color: GRN, fontSize: 10 }}>{exp.company}</div>
                  <div style={{ color: MUT, fontSize: 9 }}>{exp.startDate} → {exp.current ? 'present' : exp.endDate}</div>
                  {exp.description && <div style={{ color: TXT, fontSize: 10, marginTop: 4 }}>{exp.description}</div>}
                </div>
              ))}
            </div>
          </>}

          {projects.some((p) => p.title) && <>
            <div style={{ color: MUT, fontSize: 9, marginBottom: 8 }}>{'// '}<span style={{ color: GRN }}>projects</span></div>
            <div style={{ ...s.col(8), marginBottom: 16 }}>
              {projects.filter((p) => p.title).map((proj) => (
                <div key={proj.id} style={{ background: CARD, padding: '8px 12px', borderRadius: 6, border: '1px solid #30363d' }}>
                  <div style={{ color: YLW, fontWeight: 600 }}>{proj.title}</div>
                  <div style={{ color: MUT, fontSize: 9 }}>{proj.role} · {proj.startDate}{proj.current ? ' → present' : proj.endDate ? ` → ${proj.endDate}` : ''}</div>
                  {proj.technologies && <div style={{ color: ACC, fontSize: 9 }}>[{proj.technologies}]</div>}
                  {proj.description && <div style={{ color: TXT, fontSize: 10, marginTop: 4 }}>{proj.description}</div>}
                  {proj.url && <div style={{ color: GRN, fontSize: 9, marginTop: 2 }}>{proj.url}</div>}
                </div>
              ))}
            </div>
          </>}

          {publications.some((p) => p.title) && <>
            <div style={{ color: MUT, fontSize: 9, marginBottom: 8 }}>{'// '}<span style={{ color: GRN }}>publications</span></div>
            <div style={{ ...s.col(6), marginBottom: 16 }}>
              {publications.filter((p) => p.title).map((pub) => (
                <div key={pub.id} style={{ background: CARD, padding: '8px 12px', borderRadius: 6, border: '1px solid #30363d' }}>
                  <div style={{ color: ACC }}>{pub.title}</div>
                  <div style={{ color: MUT, fontSize: 9 }}>{pub.publisher} · {pub.date}{pub.doi ? ` · ${pub.doi}` : ''}</div>
                </div>
              ))}
            </div>
          </>}

          {volunteer.some((v) => v.organization) && <>
            <div style={{ color: MUT, fontSize: 9, marginBottom: 8 }}>{'// '}<span style={{ color: GRN }}>volunteer</span></div>
            <div style={s.col(6)}>
              {volunteer.filter((v) => v.organization).map((vol) => (
                <div key={vol.id} style={{ color: TXT, fontSize: 10 }}>❤ {vol.role} @ {vol.organization}</div>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 8. ACADEMIC CV TEMPLATE
// ═══════════════════════════════════════════════════════════════════
function AcademicTemplate({ personal, education, experience, skills, awards, certificates, projects, volunteer, publications }: TP) {
  const ACC = '#1e3a8a';
  const sec = (title: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: ACC, borderBottom: `1.5px solid ${ACC}`, paddingBottom: 3, marginBottom: 10, marginTop: 20 }}>{title}</div>
  );
  return (
    <div id="resume-preview" style={{ background: '#fff', color: '#111', fontFamily: 'Georgia, serif', minHeight: 1100, fontSize: 11, lineHeight: 1.7, padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: ACC, margin: 0 }}>{personal.fullName || 'Your Name'}</h1>
        {personal.fullNameKorean && <p style={{ color: '#6b7280', margin: '2px 0 0', fontStyle: 'italic' }}>{personal.fullNameKorean}</p>}
        <div style={{ display: 'flex', gap: 16, color: '#6b7280', fontSize: 10, marginTop: 6, flexWrap: 'wrap', fontFamily: 'sans-serif' }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.address && <span>{personal.address}</span>}
          {personal.nationality && <span>{personal.nationality}</span>}
        </div>
      </div>

      {/* Publications first in Academic */}
      {publications.some((p) => p.title) && <>
        {sec('Publications & Research')}
        <div style={s.col(10)}>
          {publications.filter((p) => p.title).map((pub, i) => (
            <div key={pub.id}>
              <span style={{ color: '#6b7280', marginRight: 6, fontFamily: 'sans-serif' }}>[{i + 1}]</span>
              <span style={{ fontStyle: 'italic' }}>{pub.title}</span>
              <span style={{ color: '#6b7280' }}> — {pub.publisher}, {pub.date}</span>
              {pub.authors && <span style={{ color: '#6b7280' }}> · {pub.authors}</span>}
              {pub.doi && <div style={{ color: ACC, fontSize: 9, marginLeft: 20, fontFamily: 'sans-serif' }}>{pub.doi}</div>}
            </div>
          ))}
        </div>
      </>}

      {education.some((e) => e.institution) && <>
        {sec('Education')}
        <div style={s.col(12)}>
          {education.filter((e) => e.institution).map((edu) => (
            <div key={edu.id} style={s.row()}>
              <div>
                <div style={{ fontWeight: 700 }}>{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                <div style={{ fontStyle: 'italic', color: '#374151' }}>{edu.institution}</div>
                {edu.gpa && <div style={{ color: '#6b7280', fontFamily: 'sans-serif', fontSize: 10 }}>GPA: {edu.gpa}</div>}
              </div>
              <div style={{ color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 16, fontFamily: 'sans-serif', fontSize: 10 }}>{edu.startDate} – {edu.endDate || 'Present'}</div>
            </div>
          ))}
        </div>
      </>}

      {experience.some((e) => e.company) && <>
        {sec('Research & Work Experience')}
        <div style={s.col(12)}>
          {experience.filter((e) => e.company).map((exp) => (
            <div key={exp.id} style={s.row()}>
              <div>
                <div style={{ fontWeight: 700 }}>{exp.position}</div>
                <div style={{ fontStyle: 'italic', color: '#374151' }}>{exp.company}</div>
                {exp.description && <div style={{ color: '#6b7280' }}>{exp.description}</div>}
              </div>
              <div style={{ color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 16, fontFamily: 'sans-serif', fontSize: 10 }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</div>
            </div>
          ))}
        </div>
      </>}

      {awards.some((a) => a.title) && <>
        {sec('Honors & Awards')}
        <div style={s.col(8)}>
          {awards.filter((a) => a.title).map((a) => (
            <div key={a.id} style={s.row()}>
              <div><span style={{ fontWeight: 600 }}>{a.title}</span><span style={{ fontStyle: 'italic', color: '#6b7280', marginLeft: 6 }}>{a.organization}</span></div>
              <span style={{ color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 16, fontFamily: 'sans-serif', fontSize: 10 }}>{a.date}</span>
            </div>
          ))}
        </div>
      </>}

      {projects.some((p) => p.title) && <>
        {sec('Projects')}
        <div style={s.col(10)}>
          {projects.filter((p) => p.title).map((proj) => (
            <div key={proj.id}>
              <div style={s.row()}>
                <div><span style={{ fontWeight: 600 }}>{proj.title}</span><span style={{ fontStyle: 'italic', color: '#6b7280', marginLeft: 6 }}>({proj.role})</span></div>
                <span style={{ color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 16, fontFamily: 'sans-serif', fontSize: 10 }}>{proj.startDate} – {proj.current ? 'Present' : proj.endDate}</span>
              </div>
              {proj.description && <div style={{ color: '#6b7280' }}>{proj.description}</div>}
            </div>
          ))}
        </div>
      </>}

      {certificates.some((c) => c.name) && <>
        {sec('Certifications')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', fontFamily: 'sans-serif' }}>
          {certificates.filter((c) => c.name).map((cert) => (
            <span key={cert.id}>{cert.name}{cert.score ? ` (${cert.score})` : ''} <span style={{ color: '#6b7280' }}>— {cert.issuer}, {cert.date}</span></span>
          ))}
        </div>
      </>}

      {skills.length > 0 && <>
        {sec('Skills & Expertise')}
        <div style={{ fontFamily: 'sans-serif' }}>{skills.map((sk) => sk.name).filter(Boolean).join(' · ')}</div>
      </>}

      {volunteer.some((v) => v.organization) && <>
        {sec('Service & Outreach')}
        <div style={s.col(6)}>
          {volunteer.filter((v) => v.organization).map((vol) => (
            <div key={vol.id}><span style={{ fontWeight: 600 }}>{vol.role}</span><span style={{ fontStyle: 'italic', color: '#6b7280', marginLeft: 6 }}>— {vol.organization}, {vol.startDate}–{vol.current ? 'Present' : vol.endDate}</span></div>
          ))}
        </div>
      </>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 9. COMPACT TEMPLATE — maximum density
// ═══════════════════════════════════════════════════════════════════
function CompactTemplate({ personal, education, experience, skills, awards, certificates, projects, volunteer, publications }: TP) {
  const ACC = '#1d4ed8';
  const sec = (title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, marginTop: 10 }}>
      <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: ACC, whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 0.5, background: '#d1d5db' }} />
    </div>
  );
  return (
    <div id="resume-preview" style={{ background: '#fff', color: '#111', fontFamily: 'sans-serif', minHeight: 1100, fontSize: 10, lineHeight: 1.45, padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `2px solid ${ACC}`, paddingBottom: 6, marginBottom: 2 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: ACC, margin: 0 }}>{personal.fullName || 'Your Name'}</h1>
          {personal.fullNameKorean && <div style={{ color: '#6b7280', fontSize: 10 }}>{personal.fullNameKorean}</div>}
        </div>
        <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 9 }}>
          {personal.email && <div>{personal.email}</div>}
          {personal.phone && <div>{personal.phone}</div>}
          {personal.address && <div>{personal.address}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, paddingTop: 2 }}>
        {/* Left compact */}
        <div>
          {sec('Skills')}
          <div style={s.col(3)}>
            {skills.map((sk) => (
              <div key={sk.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#374151' }}>{sk.name}</span>
                <span style={{ color: '#9ca3af', fontSize: 8 }}>{sk.level.slice(0, 3)}</span>
              </div>
            ))}
          </div>
          {certificates.some((c) => c.name) && <>
            {sec('Certs')}
            <div style={s.col(2)}>
              {certificates.filter((c) => c.name).map((cert) => (
                <div key={cert.id} style={{ color: '#374151' }}>{cert.name}{cert.score ? ` (${cert.score})` : ''}</div>
              ))}
            </div>
          </>}
          {awards.some((a) => a.title) && <>
            {sec('Awards')}
            <div style={s.col(2)}>
              {awards.filter((a) => a.title).map((a) => (
                <div key={a.id}><div style={{ color: '#374151' }}>{a.title}</div><div style={{ color: '#9ca3af', fontSize: 8 }}>{a.organization} · {a.date}</div></div>
              ))}
            </div>
          </>}
          {volunteer.some((v) => v.organization) && <>
            {sec('Volunteer')}
            <div style={s.col(2)}>
              {volunteer.filter((v) => v.organization).map((vol) => (
                <div key={vol.id}><div style={{ color: '#374151' }}>{vol.role}</div><div style={{ color: '#9ca3af', fontSize: 8 }}>{vol.organization}</div></div>
              ))}
            </div>
          </>}
        </div>

        {/* Right compact */}
        <div>
          {education.some((e) => e.institution) && <>
            {sec('Education')}
            <div style={s.col(4)}>
              {education.filter((e) => e.institution).map((edu) => (
                <div key={edu.id} style={s.row()}>
                  <div><div style={{ fontWeight: 600, color: '#1f2937' }}>{edu.institution}</div><div style={{ color: '#6b7280' }}>{edu.degree}{edu.field && ` · ${edu.field}`}{edu.gpa ? ` · GPA ${edu.gpa}` : ''}</div></div>
                  <span style={{ color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 6, fontSize: 9 }}>{edu.startDate}–{edu.endDate || 'Now'}</span>
                </div>
              ))}
            </div>
          </>}
          {experience.some((e) => e.company) && <>
            {sec('Experience')}
            <div style={s.col(5)}>
              {experience.filter((e) => e.company).map((exp) => (
                <div key={exp.id}>
                  <div style={s.row()}>
                    <div><span style={{ fontWeight: 600, color: '#1f2937' }}>{exp.position}</span><span style={{ color: '#6b7280' }}> @ {exp.company}</span></div>
                    <span style={{ color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 6, fontSize: 9 }}>{exp.startDate}–{exp.current ? 'Now' : exp.endDate}</span>
                  </div>
                  {exp.description && <div style={{ color: '#6b7280', fontSize: 9 }}>{exp.description}</div>}
                </div>
              ))}
            </div>
          </>}
          {projects.some((p) => p.title) && <>
            {sec('Projects')}
            <div style={s.col(5)}>
              {projects.filter((p) => p.title).map((proj) => (
                <div key={proj.id}>
                  <div style={s.row()}>
                    <div><span style={{ fontWeight: 600, color: '#1f2937' }}>{proj.title}</span><span style={{ color: '#6b7280' }}> · {proj.role}</span></div>
                    <span style={{ color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 6, fontSize: 9 }}>{proj.startDate}–{proj.current ? 'Now' : proj.endDate}</span>
                  </div>
                  {proj.technologies && <div style={{ color: '#9ca3af', fontSize: 8 }}>{proj.technologies}</div>}
                  {proj.description && <div style={{ color: '#6b7280', fontSize: 9 }}>{proj.description}</div>}
                </div>
              ))}
            </div>
          </>}
          {publications.some((p) => p.title) && <>
            {sec('Publications')}
            <div style={s.col(4)}>
              {publications.filter((p) => p.title).map((pub) => (
                <div key={pub.id}><span style={{ fontWeight: 600, color: '#1f2937', fontStyle: 'italic' }}>{pub.title}</span><span style={{ color: '#6b7280' }}> — {pub.publisher}, {pub.date}</span></div>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
