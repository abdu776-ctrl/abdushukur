'use client';

import type { PersonalInfo, Education, WorkExperience, Skill, ResumeTemplate } from '@/types';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';

interface ResumePreviewProps {
  personal: PersonalInfo;
  education: Education[];
  experience: WorkExperience[];
  skills: Skill[];
  template: ResumeTemplate;
}

export function ResumePreview({
  personal,
  education,
  experience,
  skills,
  template,
}: ResumePreviewProps) {
  if (template === 'modern') return <ModernTemplate personal={personal} education={education} experience={experience} skills={skills} />;
  if (template === 'classic') return <ClassicTemplate personal={personal} education={education} experience={experience} skills={skills} />;
  if (template === 'korean') return <KoreanTemplate personal={personal} education={education} experience={experience} skills={skills} />;
  return <MinimalTemplate personal={personal} education={education} experience={experience} skills={skills} />;
}

type TemplateProps = Omit<ResumePreviewProps, 'template'>;

function ModernTemplate({ personal, education, experience, skills }: TemplateProps) {
  return (
    <div id="resume-preview" className="bg-white p-8 text-gray-900 font-sans min-h-[1100px]" style={{ fontSize: '11px', lineHeight: '1.5' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -m-8 p-8 mb-6 flex items-center gap-5">
        {personal.photo ? (
          <img
            src={personal.photo}
            alt={personal.fullName}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-white/30"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {personal.fullNameKorean ? personal.fullNameKorean[0] : (personal.fullName[0] || '?')}
          </div>
        )}
        <div className="text-white flex-1">
          <h1 className="text-2xl font-bold mb-0.5">
            {personal.fullName || 'Your Name'}
            {personal.fullNameKorean && <span className="text-indigo-200 ml-2 text-lg">({personal.fullNameKorean})</span>}
          </h1>
          <div className="flex flex-wrap gap-3 text-indigo-200 text-xs mt-2">
            {personal.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{personal.email}</span>}
            {personal.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{personal.phone}</span>}
            {personal.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{personal.address}</span>}
            {personal.nationality && <span>🌍 {personal.nationality}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-1 space-y-5">
          {/* Skills */}
          {skills.length > 0 && (
            <Section title="Skills" color="indigo">
              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id}>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-medium text-gray-700">{skill.name || 'Skill'}</span>
                      <span className="text-gray-400 capitalize">{skill.level}</span>
                    </div>
                    <SkillBar level={skill.level} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Personal details */}
          {(personal.dateOfBirth || personal.nationality) && (
            <Section title="Details" color="indigo">
              <div className="space-y-1.5 text-gray-600">
                {personal.dateOfBirth && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>{personal.dateOfBirth}</span>
                  </div>
                )}
                {personal.nationality && (
                  <div>🌍 {personal.nationality}</div>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* Right columns */}
        <div className="col-span-2 space-y-5">
          {/* Education */}
          {education.some((e) => e.institution) && (
            <Section title="Education" color="indigo">
              <div className="space-y-3">
                {education.filter((e) => e.institution).map((edu) => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{edu.institution}</p>
                        <p className="text-gray-600">{edu.degree}{edu.field && ` — ${edu.field}`}</p>
                      </div>
                      <span className="text-gray-400 whitespace-nowrap ml-2">
                        {edu.startDate} — {edu.endDate || 'Present'}
                      </span>
                    </div>
                    {edu.gpa && <p className="text-gray-500 mt-0.5">GPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Experience */}
          {experience.some((e) => e.company) && (
            <Section title="Experience" color="indigo">
              <div className="space-y-4">
                {experience.filter((e) => e.company).map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{exp.position}</p>
                        <p className="text-gray-600">{exp.company}</p>
                      </div>
                      <span className="text-gray-400 whitespace-nowrap ml-2">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-gray-600 mt-1 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Empty state */}
          {!education.some((e) => e.institution) && !experience.some((e) => e.company) && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Fill in your information to see the preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassicTemplate({ personal, education, experience, skills }: TemplateProps) {
  return (
    <div id="resume-preview" className="bg-white p-8 text-gray-900 font-sans min-h-[1100px]" style={{ fontSize: '11px', lineHeight: '1.6' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold tracking-wide uppercase">
          {personal.fullName || 'Your Name'}
          {personal.fullNameKorean && <span className="text-gray-500 ml-3 text-xl normal-case">({personal.fullNameKorean})</span>}
        </h1>
        <div className="flex justify-center gap-4 text-gray-600 text-xs mt-2 flex-wrap">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>|</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.address && <span>|</span>}
          {personal.address && <span>{personal.address}</span>}
        </div>
      </div>

      <div className="space-y-5">
        {education.some((e) => e.institution) && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-3">Education</h2>
            {education.filter((e) => e.institution).map((edu) => (
              <div key={edu.id} className="flex justify-between mb-2">
                <div>
                  <p className="font-semibold">{edu.institution}</p>
                  <p className="text-gray-600">{edu.degree}{edu.field && `, ${edu.field}`}</p>
                </div>
                <p className="text-gray-500 whitespace-nowrap">{edu.startDate} – {edu.endDate || 'Present'}</p>
              </div>
            ))}
          </div>
        )}

        {experience.some((e) => e.company) && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-3">Experience</h2>
            {experience.filter((e) => e.company).map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between">
                  <p className="font-semibold">{exp.position} — {exp.company}</p>
                  <p className="text-gray-500 whitespace-nowrap">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</p>
                </div>
                {exp.description && <p className="text-gray-600 mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill.id} className="px-2.5 py-1 rounded border border-gray-300 text-gray-700 text-xs">
                  {skill.name || 'Skill'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MinimalTemplate({ personal, education, experience, skills }: TemplateProps) {
  return (
    <div id="resume-preview" className="bg-white p-10 text-gray-900 font-sans min-h-[1100px]" style={{ fontSize: '11px', lineHeight: '1.7' }}>
      <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-1">
        {personal.fullName || 'Your Name'}
      </h1>
      {personal.fullNameKorean && (
        <p className="text-gray-500 mb-3">{personal.fullNameKorean}</p>
      )}
      <div className="flex gap-4 text-gray-400 text-xs mb-8">
        {personal.email && <span>{personal.email}</span>}
        {personal.phone && <span>{personal.phone}</span>}
        {personal.address && <span>{personal.address}</span>}
      </div>

      <div className="space-y-8">
        {education.some((e) => e.institution) && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">Education</h2>
            {education.filter((e) => e.institution).map((edu) => (
              <div key={edu.id} className="mb-3">
                <p className="font-medium text-gray-800">{edu.institution}</p>
                <p className="text-gray-500">{edu.degree}{edu.field && `, ${edu.field}`} · {edu.startDate}–{edu.endDate || 'Present'}</p>
              </div>
            ))}
          </div>
        )}
        {experience.some((e) => e.company) && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">Experience</h2>
            {experience.filter((e) => e.company).map((exp) => (
              <div key={exp.id} className="mb-4">
                <p className="font-medium text-gray-800">{exp.position}</p>
                <p className="text-gray-500">{exp.company} · {exp.startDate}–{exp.current ? 'Present' : exp.endDate}</p>
                {exp.description && <p className="text-gray-600 mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        )}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">Skills</h2>
            <p className="text-gray-700">{skills.map((s) => s.name).filter(Boolean).join(' · ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KoreanTemplate({ personal, education, experience, skills }: TemplateProps) {
  return (
    <div id="resume-preview" className="bg-white p-8 text-gray-900 min-h-[1100px]" style={{ fontSize: '10px', fontFamily: 'Noto Sans KR, sans-serif', lineHeight: '1.8' }}>
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold">이 력 서</h1>
      </div>

      <div className="flex gap-6 mb-6">
        {/* Photo */}
        <div className="w-28 h-36 border-2 border-gray-300 flex-shrink-0 overflow-hidden">
          {personal.photo ? (
            <img src={personal.photo} alt={personal.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-xs text-center">증명사진<br/>3×4cm</span>
            </div>
          )}
        </div>

        {/* Personal info table */}
        <table className="flex-1 text-xs border-collapse">
          <tbody>
            <tr>
              <td className="border border-gray-300 bg-gray-50 px-2 py-1.5 font-semibold w-20 whitespace-nowrap">성 명</td>
              <td className="border border-gray-300 px-2 py-1.5">{personal.fullName || ''}</td>
              <td className="border border-gray-300 bg-gray-50 px-2 py-1.5 font-semibold whitespace-nowrap">한국어 이름</td>
              <td className="border border-gray-300 px-2 py-1.5">{personal.fullNameKorean || ''}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 bg-gray-50 px-2 py-1.5 font-semibold whitespace-nowrap">생년월일</td>
              <td className="border border-gray-300 px-2 py-1.5">{personal.dateOfBirth || ''}</td>
              <td className="border border-gray-300 bg-gray-50 px-2 py-1.5 font-semibold whitespace-nowrap">국 적</td>
              <td className="border border-gray-300 px-2 py-1.5">{personal.nationality || ''}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 bg-gray-50 px-2 py-1.5 font-semibold whitespace-nowrap">연락처</td>
              <td className="border border-gray-300 px-2 py-1.5" colSpan={3}>{personal.phone || ''}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 bg-gray-50 px-2 py-1.5 font-semibold whitespace-nowrap">이메일</td>
              <td className="border border-gray-300 px-2 py-1.5" colSpan={3}>{personal.email || ''}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 bg-gray-50 px-2 py-1.5 font-semibold whitespace-nowrap">주 소</td>
              <td className="border border-gray-300 px-2 py-1.5" colSpan={3}>{personal.address || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Education section */}
      {education.some((e) => e.institution) && (
        <div className="mb-5">
          <h2 className="font-bold text-sm border-b-2 border-gray-800 pb-1 mb-2">학 력 사 항</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-1.5 font-semibold">기간</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold">학교명</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold">전공</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold">학위</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold">학점</th>
              </tr>
            </thead>
            <tbody>
              {education.filter((e) => e.institution).map((edu) => (
                <tr key={edu.id}>
                  <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{edu.startDate} ~ {edu.endDate || '현재'}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{edu.institution}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{edu.field}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{edu.degree}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{edu.gpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Experience section */}
      {experience.some((e) => e.company) && (
        <div className="mb-5">
          <h2 className="font-bold text-sm border-b-2 border-gray-800 pb-1 mb-2">경 력 사 항</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-1.5 font-semibold">기간</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold">회사명</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold">직위</th>
                <th className="border border-gray-300 px-2 py-1.5 font-semibold">업무내용</th>
              </tr>
            </thead>
            <tbody>
              {experience.filter((e) => e.company).map((exp) => (
                <tr key={exp.id}>
                  <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{exp.startDate} ~ {exp.current ? '현재' : exp.endDate}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{exp.company}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{exp.position}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{exp.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-5">
          <h2 className="font-bold text-sm border-b-2 border-gray-800 pb-1 mb-2">자격증 및 기술</h2>
          <table className="w-full border-collapse text-xs">
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td className="border border-gray-300 px-2 py-1.5 w-1/3">{skill.name || 'Skill'}</td>
                  <td className="border border-gray-300 px-2 py-1.5 capitalize">{skill.level}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{skill.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-gray-500">
        <p>위 사항은 사실과 틀림없음을 확인합니다.</p>
        <p className="mt-1">날 짜: {new Date().toLocaleDateString('ko-KR')}</p>
        <p className="mt-4">지원자: {personal.fullName} (서 명)</p>
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className={`text-xs font-bold uppercase tracking-wider text-${color}-600 mb-2 pb-1 border-b border-${color}-100`}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SkillBar({ level }: { level: Skill['level'] }) {
  const widths = { beginner: 25, intermediate: 50, advanced: 75, expert: 95 };
  const colors = { beginner: 'bg-gray-300', intermediate: 'bg-yellow-400', advanced: 'bg-blue-500', expert: 'bg-green-500' };
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full">
      <div className={`h-full rounded-full ${colors[level]}`} style={{ width: `${widths[level]}%` }} />
    </div>
  );
}
