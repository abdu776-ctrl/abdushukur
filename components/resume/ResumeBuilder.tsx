'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ResumePreview } from './ResumePreview';
import { TemplateSelector } from './TemplateSelector';
import { exportToPDF } from '@/lib/utils';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PersonalInfo, Education, WorkExperience, Skill, ResumeTemplate } from '@/types';

type Section = 'personal' | 'education' | 'experience' | 'skills';

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

  const [personal, setPersonal] = useState<PersonalInfo>(defaultPersonal);
  const [education, setEducation] = useState<Education[]>([{ ...defaultEducation }]);
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([
    { id: '1', name: 'Korean (TOPIK)', level: 'advanced', category: 'Language' },
    { id: '2', name: 'English', level: 'intermediate', category: 'Language' },
  ]);

  const sections = [
    { id: 'personal' as Section, icon: <User className="w-4 h-4" />, label: t('sections.personal') },
    { id: 'education' as Section, icon: <GraduationCap className="w-4 h-4" />, label: t('sections.education') },
    { id: 'experience' as Section, icon: <Briefcase className="w-4 h-4" />, label: t('sections.experience') },
    { id: 'skills' as Section, icon: <Code2 className="w-4 h-4" />, label: t('sections.skills') },
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

  async function handleExport() {
    setExporting(true);
    await exportToPDF('resume-preview', `resume-${personal.fullName || 'koreer'}`);
    setExporting(false);
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
            <span className="text-xs text-gray-400 dark:text-gray-500">Template:</span>
            <Badge variant="purple" size="sm" className="capitalize">{selectedTemplate}</Badge>
          </button>
          <Button
            variant="secondary"
            size="sm"
            icon={showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden"
          >
            {showPreview ? 'Hide' : 'Preview'}
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

        {/* Section tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-2xl">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-medium transition-all duration-150',
                activeSection === section.id
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {section.icon}
              <span className="hidden sm:block truncate w-full text-center">{section.label.split(' ')[0]}</span>
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
                  AI fill
                </button>
              </div>

              {/* Photo upload area */}
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-2 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('personal.uploadPhoto')}</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
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
        </div>
      </div>

      {/* Right: Preview */}
      <div className={cn(
        'flex-1 min-w-0',
        showPreview ? 'block' : 'hidden lg:block'
      )}>
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              loading={exporting}
              onClick={handleExport}
            >
              Export PDF
            </Button>
          </div>
          <div className="bg-white rounded-2xl shadow-xl overflow-auto max-h-[calc(100vh-12rem)] border border-gray-200">
            <ResumePreview
              personal={personal}
              education={education}
              experience={experience}
              skills={skills}
              template={selectedTemplate}
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
