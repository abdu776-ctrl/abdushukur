'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ResumePreview, DEFAULT_SECTION_ORDER } from './ResumePreview';
import { TemplateSelector } from './TemplateSelector';
import { NameTranslator } from './NameTranslator';
import { exportToPDF, exportToWord } from '@/lib/utils';
import {
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Plus,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Camera,
  Trophy,
  BadgeCheck,
  FolderGit2,
  Heart,
  BookOpen,
  FileType,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PersonalInfo, Education, WorkExperience, Skill, Award, Certificate, Project, Volunteer, Publication, ResumeTemplate } from '@/types';

type Section = 'personal' | 'education' | 'experience' | 'skills' | 'awards' | 'certificates' | 'projects' | 'volunteer' | 'publications';

const defaultPersonal: PersonalInfo = {
  fullName: '',
  fullNameKorean: '',
  email: '',
  phone: '',
  nationality: '',
  address: '',
  dateOfBirth: '',
};

const defaultEducation: Education = {
  id: '1',
  institution: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  gpa: '',
};

export function ResumeBuilder() {
  const t = useTranslations('resume');
  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>('modern');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [exporting, setExporting] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  // Document section order (honored by single-column Classic templates).
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function moveSection(from: number, to: number) {
    if (to < 0 || to >= sectionOrder.length) return;
    setSectionOrder((prev) => {
      const a = [...prev];
      const [m] = a.splice(from, 1);
      a.splice(to, 0, m);
      return a;
    });
  }

  const [personal, setPersonal] = useState<PersonalInfo>(defaultPersonal);
  const [education, setEducation] = useState<Education[]>([{ ...defaultEducation }]);
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  // Start empty — seeding example skills made them look like real user data
  // in the live preview. The Skills section simply hides until the user adds one.
  const [skills, setSkills] = useState<Skill[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [volunteer, setVolunteer] = useState<Volunteer[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);

  const sections = [
    { id: 'personal' as Section, icon: <User className="w-4 h-4" />, label: t('sections.personal') },
    { id: 'education' as Section, icon: <GraduationCap className="w-4 h-4" />, label: t('sections.education') },
    { id: 'experience' as Section, icon: <Briefcase className="w-4 h-4" />, label: t('sections.experience') },
    { id: 'skills' as Section, icon: <Code2 className="w-4 h-4" />, label: t('sections.skills') },
    { id: 'awards' as Section, icon: <Trophy className="w-4 h-4" />, label: t('sections.awards') },
    { id: 'certificates' as Section, icon: <BadgeCheck className="w-4 h-4" />, label: t('sections.certificates') },
    { id: 'projects' as Section, icon: <FolderGit2 className="w-4 h-4" />, label: t('sections.projects') },
    { id: 'volunteer' as Section, icon: <Heart className="w-4 h-4" />, label: t('sections.volunteer') },
    { id: 'publications' as Section, icon: <BookOpen className="w-4 h-4" />, label: t('sections.publications') },
  ];

  function addEducation() {
    setEducation([...education, { ...defaultEducation, id: Date.now().toString() }]);
  }

  function removeEducation(id: string) {
    setEducation(education.filter((e) => e.id !== id));
  }

  function addExperience() {
    setExperience([...experience, {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: [],
    }]);
  }

  function removeExperience(id: string) {
    setExperience(experience.filter((e) => e.id !== id));
  }

  function addSkill() {
    setSkills([...skills, {
      id: Date.now().toString(),
      name: '',
      level: 'intermediate',
      category: 'General',
    }]);
  }

  function removeSkill(id: string) {
    setSkills(skills.filter((s) => s.id !== id));
  }

  function addAward() {
    setAwards([...awards, { id: Date.now().toString(), title: '', organization: '', date: '', type: 'award' }]);
  }
  function removeAward(id: string) { setAwards(awards.filter((a) => a.id !== id)); }

  function addCertificate() {
    setCertificates([...certificates, { id: Date.now().toString(), name: '', issuer: '', date: '' }]);
  }
  function removeCertificate(id: string) { setCertificates(certificates.filter((c) => c.id !== id)); }

  function addProject() {
    setProjects([...projects, { id: Date.now().toString(), title: '', role: '', startDate: '', endDate: '', current: false, description: '' }]);
  }
  function removeProject(id: string) { setProjects(projects.filter((p) => p.id !== id)); }

  function addVolunteer() {
    setVolunteer([...volunteer, { id: Date.now().toString(), organization: '', role: '', startDate: '', endDate: '', current: false, description: '' }]);
  }
  function removeVolunteer(id: string) { setVolunteer(volunteer.filter((v) => v.id !== id)); }

  function addPublication() {
    setPublications([...publications, { id: Date.now().toString(), title: '', type: 'journal', publisher: '', date: '' }]);
  }
  function removePublication(id: string) { setPublications(publications.filter((p) => p.id !== id)); }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPersonal((prev) => ({ ...prev, photo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleExport() {
    setExporting(true);
    try {
      if (!showPreview) setShowPreview(true);
      // Give the preview a moment to mount if it was just shown.
      await new Promise((r) => setTimeout(r, 100));
      await exportToPDF('resume-preview', `resume-${personal.fullName || 'koreer'}`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(
        'PDF yuklab olishда xatolik yuz berdi. Iltimos, avval "Preview" (koʻrish) tugmasini bosib, resume koʻrinishini oching, keyin qayta urinib koʻring.'
      );
    } finally {
      setExporting(false);
    }
  }

  function handleExportWord() {
    try {
      if (!showPreview) setShowPreview(true);
      exportToWord('resume-preview', `resume-${personal.fullName || 'koreer'}`);
    } catch (err) {
      console.error('Word export failed:', err);
      alert('Word faylni saqlashда xatolik. Avval "Preview" ni oching va qayta urinib koʻring.');
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Editor */}
      <div className="w-full lg:w-[480px] flex-shrink-0 space-y-4">
        {/* Template & Actions bar */}
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all text-sm text-gray-700 dark:text-gray-300"
          >
            <span className="text-xs text-gray-400 dark:text-gray-500">{t('builder.template')}:</span>
            <Badge variant="purple" size="sm" className="capitalize">{selectedTemplate}</Badge>
          </button>
          <Button
            variant="secondary"
            size="sm"
            icon={showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden"
          >
            {showPreview ? t('builder.hide') : t('builder.preview')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<FileType className="w-4 h-4" />}
            onClick={handleExportWord}
          >
            Word
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            loading={exporting}
            onClick={handleExport}
          >
            PDF
          </Button>
        </div>

        {/* Section order (drag or use arrows) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOrderPanel((v) => !v)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <GripVertical className="w-4 h-4 text-gray-400" />
              {t('sectionOrder.title')}
            </span>
            {showOrderPanel ? <ArrowUp className="w-4 h-4 text-gray-400" /> : <ArrowDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showOrderPanel && (
            <div className="px-3 pb-3 space-y-1.5 animate-slide-down">
              <p className="text-xs text-gray-400 dark:text-gray-500 px-1 pb-1">{t('sectionOrder.note')}</p>
              {sectionOrder.map((id, i) => (
                <div
                  key={id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIndex !== null) moveSection(dragIndex, i); setDragIndex(null); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{t(`sections.${id}`)}</span>
                  <button type="button" onClick={() => moveSection(i, i - 1)} disabled={i === 0} className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Up">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveSection(i, i + 1)} disabled={i === sectionOrder.length - 1} className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Down">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-2xl overflow-x-auto scrollbar-hide">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              title={section.label}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-2.5 rounded-xl text-xs font-medium transition-all duration-150 flex-shrink-0',
                activeSection === section.id
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {section.icon}
              <span className="text-[10px] leading-tight whitespace-nowrap">{section.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">

          {/* Personal Info */}
          {activeSection === 'personal' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  {t('sections.personal')}
                </h2>
                <button className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
                  <Sparkles className="w-3 h-3" />
                  {t('builder.aiFill')}
                </button>
              </div>

              {/* Photo upload area */}
              <div className="relative">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {personal.photo ? (
                  <div className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <img
                      src={personal.photo}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-indigo-200 dark:border-indigo-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Photo uploaded</p>
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" />
                        Change photo
                      </button>
                    </div>
                    <button
                      onClick={() => setPersonal((prev) => ({ ...prev, photo: undefined }))}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-2 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('personal.uploadPhoto')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('builder.photoHint')}</p>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('personal.fullName')}
                  placeholder="Abdushukur Yusupov"
                  value={personal.fullName}
                  onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                />
                <Input
                  label={t('personal.fullNameKorean')}
                  placeholder="아브두슈쿠르"
                  value={personal.fullNameKorean || ''}
                  onChange={(e) => setPersonal({ ...personal, fullNameKorean: e.target.value })}
                />
              </div>

              {/* Name translator */}
              <div className="-mt-1">
                <NameTranslator
                  label={t('personal.translateName')}
                  fullName={personal.fullName}
                  koreanName={personal.fullNameKorean || ''}
                  onApplyFullName={(v) => setPersonal((p) => ({ ...p, fullName: v }))}
                  onApplyKorean={(v) => setPersonal((p) => ({ ...p, fullNameKorean: v }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('personal.email')}
                  type="email"
                  placeholder="you@example.com"
                  value={personal.email}
                  onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                />
                <Input
                  label={t('personal.phone')}
                  placeholder="010-1234-5678"
                  value={personal.phone}
                  onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('personal.dateOfBirth')}
                  type="date"
                  min="1950-01-01"
                  max="2012-12-31"
                  value={personal.dateOfBirth || ''}
                  onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
                />
                <Input
                  label={t('personal.nationality')}
                  placeholder="Uzbekistan"
                  value={personal.nationality}
                  onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })}
                />
              </div>
              <Input
                label={t('personal.address')}
                placeholder="Seoul, South Korea"
                value={personal.address || ''}
                onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
              />
            </div>
          )}

          {/* Education */}
          {activeSection === 'education' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  {t('sections.education')}
                </h2>
              </div>
              {education.map((edu, i) => (
                <div key={edu.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{i + 1}</span>
                    {education.length > 1 && (
                      <button
                        onClick={() => removeEducation(edu.id)}
                        className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    label={t('education.institution')}
                    placeholder="Hanyang University"
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[i].institution = e.target.value;
                      setEducation(updated);
                    }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={t('education.degree')}
                      placeholder="Bachelor's"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[i].degree = e.target.value;
                        setEducation(updated);
                      }}
                    />
                    <Input
                      label={t('education.field')}
                      placeholder="Computer Science"
                      value={edu.field}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[i].field = e.target.value;
                        setEducation(updated);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={t('education.startDate')}
                      type="month"
                      value={edu.startDate}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[i].startDate = e.target.value;
                        setEducation(updated);
                      }}
                    />
                    <Input
                      label={t('education.endDate')}
                      type="month"
                      value={edu.endDate}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[i].endDate = e.target.value;
                        setEducation(updated);
                      }}
                    />
                  </div>
                  <Input
                    label={t('education.gpa')}
                    placeholder="4.2 / 4.5"
                    value={edu.gpa || ''}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[i].gpa = e.target.value;
                      setEducation(updated);
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={addEducation}
                className="w-full"
              >
                {t('education.add')}
              </Button>
            </div>
          )}

          {/* Experience */}
          {activeSection === 'experience' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  {t('sections.experience')}
                </h2>
              </div>
              {experience.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No experience added yet</p>
                </div>
              )}
              {experience.map((exp, i) => (
                <div key={exp.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{i + 1}</span>
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={t('experience.company')}
                      placeholder="Samsung Electronics"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[i].company = e.target.value;
                        setExperience(updated);
                      }}
                    />
                    <Input
                      label={t('experience.position')}
                      placeholder="Software Engineer"
                      value={exp.position}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[i].position = e.target.value;
                        setExperience(updated);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={t('experience.startDate')}
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[i].startDate = e.target.value;
                        setExperience(updated);
                      }}
                    />
                    <Input
                      label={exp.current ? '' : t('experience.endDate')}
                      type="month"
                      value={exp.endDate}
                      disabled={exp.current}
                      placeholder={exp.current ? 'Present' : ''}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[i].endDate = e.target.value;
                        setExperience(updated);
                      }}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[i].current = e.target.checked;
                        setExperience(updated);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('experience.current')}</span>
                  </label>
                  <Textarea
                    label={t('experience.description')}
                    placeholder="Describe your responsibilities and achievements..."
                    value={exp.description}
                    rows={3}
                    onChange={(e) => {
                      const updated = [...experience];
                      updated[i].description = e.target.value;
                      setExperience(updated);
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={addExperience}
                className="w-full"
              >
                {t('experience.add')}
              </Button>
            </div>
          )}

          {/* Skills */}
          {activeSection === 'skills' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-500" />
                  {t('sections.skills')}
                </h2>
              </div>
              <div className="space-y-3">
                {skills.map((skill, i) => (
                  <div key={skill.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                      <input
                        className="text-sm bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 font-medium"
                        placeholder={t('skills.name')}
                        value={skill.name}
                        onChange={(e) => {
                          const updated = [...skills];
                          updated[i].name = e.target.value;
                          setSkills(updated);
                        }}
                      />
                      <select
                        className="text-xs bg-transparent border-none outline-none text-gray-500 dark:text-gray-400"
                        value={skill.level}
                        onChange={(e) => {
                          const updated = [...skills];
                          updated[i].level = e.target.value as Skill['level'];
                          setSkills(updated);
                        }}
                      >
                        <option value="beginner">{t('skills.beginner')}</option>
                        <option value="intermediate">{t('skills.intermediate')}</option>
                        <option value="advanced">{t('skills.advanced')}</option>
                        <option value="expert">{t('skills.expert')}</option>
                      </select>
                    </div>
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      skill.level === 'beginner' && 'bg-gray-300',
                      skill.level === 'intermediate' && 'bg-yellow-400',
                      skill.level === 'advanced' && 'bg-blue-500',
                      skill.level === 'expert' && 'bg-green-500',
                    )} />
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={addSkill}
                className="w-full"
              >
                {t('skills.add')}
              </Button>
            </div>
          )}
          {/* Awards & Scholarships */}
          {activeSection === 'awards' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-indigo-500" />
                {t('sections.awards')}
              </h2>
              {awards.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">수상 / 장학금 없음</p>
                </div>
              )}
              {awards.map((award, i) => (
                <div key={award.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{i + 1}</span>
                    <button onClick={() => removeAward(award.id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input label={t('awards.title')} placeholder="국가장학금 1유형" value={award.title}
                    onChange={(e) => { const u = [...awards]; u[i].title = e.target.value; setAwards(u); }} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('awards.organization')} placeholder="한국장학재단" value={award.organization}
                      onChange={(e) => { const u = [...awards]; u[i].organization = e.target.value; setAwards(u); }} />
                    <Input label={t('awards.date')} type="month" value={award.date}
                      onChange={(e) => { const u = [...awards]; u[i].date = e.target.value; setAwards(u); }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('awards.type')}</label>
                    <select value={award.type}
                      onChange={(e) => { const u = [...awards]; u[i].type = e.target.value as Award['type']; setAwards(u); }}
                      className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="award">{t('awards.typeAward')}</option>
                      <option value="scholarship">{t('awards.typeScholarship')}</option>
                      <option value="honor">{t('awards.typeHonor')}</option>
                    </select>
                  </div>
                  <Input label={t('awards.description')} placeholder="수상 내용 및 의미" value={award.description || ''}
                    onChange={(e) => { const u = [...awards]; u[i].description = e.target.value; setAwards(u); }} />
                </div>
              ))}
              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addAward} className="w-full">
                {t('awards.add')}
              </Button>
            </div>
          )}

          {/* Certificates */}
          {activeSection === 'certificates' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <BadgeCheck className="w-4 h-4 text-indigo-500" />
                {t('sections.certificates')}
              </h2>
              {certificates.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <BadgeCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">자격증 없음</p>
                </div>
              )}
              {certificates.map((cert, i) => (
                <div key={cert.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{i + 1}</span>
                    <button onClick={() => removeCertificate(cert.id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input label={t('certificates.name')} placeholder="TOPIK II (한국어능력시험)" value={cert.name}
                    onChange={(e) => { const u = [...certificates]; u[i].name = e.target.value; setCertificates(u); }} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('certificates.issuer')} placeholder="국립국제교육원" value={cert.issuer}
                      onChange={(e) => { const u = [...certificates]; u[i].issuer = e.target.value; setCertificates(u); }} />
                    <Input label={t('certificates.date')} type="month" value={cert.date}
                      onChange={(e) => { const u = [...certificates]; u[i].date = e.target.value; setCertificates(u); }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('certificates.score')} placeholder="6급 / 560점" value={cert.score || ''}
                      onChange={(e) => { const u = [...certificates]; u[i].score = e.target.value; setCertificates(u); }} />
                    <Input label={t('certificates.credentialId')} placeholder="2024-TOPIK-12345" value={cert.credentialId || ''}
                      onChange={(e) => { const u = [...certificates]; u[i].credentialId = e.target.value; setCertificates(u); }} />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addCertificate} className="w-full">
                {t('certificates.add')}
              </Button>
            </div>
          )}

          {/* Projects */}
          {activeSection === 'projects' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <FolderGit2 className="w-4 h-4 text-indigo-500" />
                {t('sections.projects')}
              </h2>
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">프로젝트 없음</p>
                </div>
              )}
              {projects.map((proj, i) => (
                <div key={proj.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{i + 1}</span>
                    <button onClick={() => removeProject(proj.id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('projects.title')} placeholder="AI 이력서 생성기" value={proj.title}
                      onChange={(e) => { const u = [...projects]; u[i].title = e.target.value; setProjects(u); }} />
                    <Input label={t('projects.role')} placeholder="팀장 / 백엔드 개발자" value={proj.role}
                      onChange={(e) => { const u = [...projects]; u[i].role = e.target.value; setProjects(u); }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('projects.startDate')} type="month" value={proj.startDate}
                      onChange={(e) => { const u = [...projects]; u[i].startDate = e.target.value; setProjects(u); }} />
                    <Input label={proj.current ? '' : t('projects.endDate')} type="month" value={proj.endDate} disabled={proj.current}
                      onChange={(e) => { const u = [...projects]; u[i].endDate = e.target.value; setProjects(u); }} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={proj.current}
                      onChange={(e) => { const u = [...projects]; u[i].current = e.target.checked; setProjects(u); }}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('projects.current')}</span>
                  </label>
                  <Input label={t('projects.technologies')} placeholder="React, Next.js, Python, PostgreSQL" value={proj.technologies || ''}
                    onChange={(e) => { const u = [...projects]; u[i].technologies = e.target.value; setProjects(u); }} />
                  <Textarea label={t('projects.description')} placeholder="프로젝트 목적, 역할, 성과를 설명하세요" value={proj.description} rows={3}
                    onChange={(e) => { const u = [...projects]; u[i].description = e.target.value; setProjects(u); }} />
                  <Input label={t('projects.url')} placeholder="https://github.com/..." value={proj.url || ''}
                    onChange={(e) => { const u = [...projects]; u[i].url = e.target.value; setProjects(u); }} />
                </div>
              ))}
              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addProject} className="w-full">
                {t('projects.add')}
              </Button>
            </div>
          )}

          {/* Volunteer */}
          {activeSection === 'volunteer' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-indigo-500" />
                {t('sections.volunteer')}
              </h2>
              {volunteer.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">봉사활동 없음</p>
                </div>
              )}
              {volunteer.map((vol, i) => (
                <div key={vol.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{i + 1}</span>
                    <button onClick={() => removeVolunteer(vol.id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('volunteer.organization')} placeholder="대한적십자사" value={vol.organization}
                      onChange={(e) => { const u = [...volunteer]; u[i].organization = e.target.value; setVolunteer(u); }} />
                    <Input label={t('volunteer.role')} placeholder="의료 통역 봉사" value={vol.role}
                      onChange={(e) => { const u = [...volunteer]; u[i].role = e.target.value; setVolunteer(u); }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('volunteer.startDate')} type="month" value={vol.startDate}
                      onChange={(e) => { const u = [...volunteer]; u[i].startDate = e.target.value; setVolunteer(u); }} />
                    <Input label={vol.current ? '' : t('volunteer.endDate')} type="month" value={vol.endDate} disabled={vol.current}
                      onChange={(e) => { const u = [...volunteer]; u[i].endDate = e.target.value; setVolunteer(u); }} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={vol.current}
                      onChange={(e) => { const u = [...volunteer]; u[i].current = e.target.checked; setVolunteer(u); }}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('volunteer.current')}</span>
                  </label>
                  <Textarea label={t('volunteer.description')} placeholder="활동 내용 및 역할" value={vol.description} rows={2}
                    onChange={(e) => { const u = [...volunteer]; u[i].description = e.target.value; setVolunteer(u); }} />
                </div>
              ))}
              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addVolunteer} className="w-full">
                {t('volunteer.add')}
              </Button>
            </div>
          )}

          {/* Publications */}
          {activeSection === 'publications' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                {t('sections.publications')}
              </h2>
              {publications.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">논문 없음</p>
                </div>
              )}
              {publications.map((pub, i) => (
                <div key={pub.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{i + 1}</span>
                    <button onClick={() => removePublication(pub.id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('publications.type')}</label>
                    <select value={pub.type}
                      onChange={(e) => { const u = [...publications]; u[i].type = e.target.value as Publication['type']; setPublications(u); }}
                      className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="thesis">{t('publications.typeThesis')}</option>
                      <option value="journal">{t('publications.typeJournal')}</option>
                      <option value="proceedings">{t('publications.typeProceedings')}</option>
                    </select>
                  </div>
                  <Textarea label={t('publications.title')} placeholder="논문 제목을 입력하세요" value={pub.title} rows={2}
                    onChange={(e) => { const u = [...publications]; u[i].title = e.target.value; setPublications(u); }} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('publications.publisher')} placeholder="한국정보과학회" value={pub.publisher}
                      onChange={(e) => { const u = [...publications]; u[i].publisher = e.target.value; setPublications(u); }} />
                    <Input label={t('publications.date')} type="month" value={pub.date}
                      onChange={(e) => { const u = [...publications]; u[i].date = e.target.value; setPublications(u); }} />
                  </div>
                  <Input label={t('publications.authors')} placeholder="홍길동, 김철수, ..." value={pub.authors || ''}
                    onChange={(e) => { const u = [...publications]; u[i].authors = e.target.value; setPublications(u); }} />
                  <Input label={t('publications.doi')} placeholder="https://doi.org/..." value={pub.doi || ''}
                    onChange={(e) => { const u = [...publications]; u[i].doi = e.target.value; setPublications(u); }} />
                  <Textarea label={t('publications.description')} placeholder="초록 또는 요약" value={pub.description || ''} rows={2}
                    onChange={(e) => { const u = [...publications]; u[i].description = e.target.value; setPublications(u); }} />
                </div>
              ))}
              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addPublication} className="w-full">
                {t('publications.add')}
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Right: Preview */}
      <div className={cn(
        'flex-1 min-w-0',
        showPreview ? 'block' : 'hidden lg:block'
      )}>
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('builder.livePreview')}</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={<FileType className="w-4 h-4" />}
                onClick={handleExportWord}
              >
                Word
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                loading={exporting}
                onClick={handleExport}
              >
                PDF
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl overflow-auto max-h-[calc(100vh-12rem)] border border-gray-200">
            <ResumePreview
              personal={personal}
              education={education}
              experience={experience}
              skills={skills}
              awards={awards}
              certificates={certificates}
              projects={projects}
              volunteer={volunteer}
              publications={publications}
              template={selectedTemplate}
              sectionOrder={sectionOrder}
            />
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          selected={selectedTemplate}
          onSelect={(t) => { setSelectedTemplate(t); setShowTemplateSelector(false); }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}
