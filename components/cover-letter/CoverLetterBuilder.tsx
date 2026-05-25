'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { exportToPDF } from '@/lib/utils';
import {
  Sparkles,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Building2,
  Target,
} from 'lucide-react';

type SectionKey = 'growth' | 'personality' | 'motivation' | 'aspiration';

interface CLSection {
  key: SectionKey;
  title: string;
  placeholder: string;
  tip: string;
  maxChars: number;
}

export function CoverLetterBuilder() {
  const t = useTranslations('coverLetter');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<SectionKey>('growth');
  const [aiLoading, setAiLoading] = useState<SectionKey | null>(null);

  const [content, setContent] = useState<Record<SectionKey, string>>({
    growth: '',
    personality: '',
    motivation: '',
    aspiration: '',
  });

  const sections: CLSection[] = [
    {
      key: 'growth',
      title: t('sections.growth'),
      placeholder: '어린 시절부터 현재까지의 성장 과정을 구체적인 경험과 함께 작성하세요...\n\n저는 우즈베키스탄에서 태어나 어려서부터 기술에 대한 열정을 가지고 자랐습니다...',
      tip: 'Describe formative experiences that shaped who you are. Korean companies value stories of perseverance and growth.',
      maxChars: 500,
    },
    {
      key: 'personality',
      title: t('sections.personality'),
      placeholder: '자신의 성격적 장점과 단점을 솔직하게 작성하세요...\n\n저의 가장 큰 장점은 끈기와 협동심입니다...',
      tip: 'Be honest about both strengths and weaknesses. Showing self-awareness is highly valued in Korean culture.',
      maxChars: 500,
    },
    {
      key: 'motivation',
      title: t('sections.motivation'),
      placeholder: '해당 기업과 직무에 지원하게 된 구체적인 이유를 작성하세요...\n\n귀사의 혁신적인 기술과 글로벌 비전에 깊은 인상을 받아...',
      tip: 'Show you\'ve researched the company. Reference specific products, values, or initiatives that resonate with you.',
      maxChars: 600,
    },
    {
      key: 'aspiration',
      title: t('sections.aspiration'),
      placeholder: '입사 후 이루고 싶은 목표와 회사에 기여하고 싶은 방향을 작성하세요...\n\n입사 후 3년 안에 핵심 개발자로 성장하여...',
      tip: 'Be specific about your goals. Korean employers appreciate ambitious but realistic plans.',
      maxChars: 600,
    },
  ];

  async function handleAISuggest(key: SectionKey) {
    setAiLoading(key);
    await new Promise((r) => setTimeout(r, 1800));
    const suggestions: Record<SectionKey, string> = {
      growth: `저는 우즈베키스탄에서 태어나 어려서부터 기술과 혁신에 깊은 관심을 가지고 성장하였습니다. 대학교에서 컴퓨터공학을 전공하며 프로그래밍의 세계에 빠져들었고, 한국어를 독학으로 공부하여 TOPIK 5급을 취득하였습니다. 이러한 경험들은 저에게 어떤 도전도 지속적인 노력으로 극복할 수 있다는 신념을 심어주었습니다.`,
      personality: `저의 가장 큰 장점은 끈기와 빠른 학습 능력입니다. 새로운 기술을 접할 때 깊이 파고들어 단기간에 습득하는 능력이 있습니다. 또한 팀원들과의 협업을 통해 시너지를 창출하는 것을 즐깁니다. 반면, 때로는 완벽주의적인 성향으로 인해 시간 관리에 어려움을 겪기도 합니다. 이를 극복하기 위해 우선순위를 정하고 시간을 체계적으로 관리하는 습관을 기르고 있습니다.`,
      motivation: `귀사의 ${company || '회사'}에 지원하게 된 것은 세계적으로 인정받는 혁신 기술과 글로벌 시장에서의 리더십 때문입니다. ${position || '해당 직무'}에서 저의 전문성을 발휘하여 귀사의 성장에 기여하고 싶습니다. 특히 귀사가 추구하는 혁신과 지속가능한 발전이라는 비전이 저의 커리어 목표와 일치합니다.`,
      aspiration: `입사 후 첫 1년 동안은 귀사의 업무 방식과 문화를 깊이 이해하고, 맡겨진 업무에서 탁월한 성과를 내는 데 집중하겠습니다. 3년 후에는 팀의 핵심 구성원으로서 프로젝트를 주도하고, 5년 내에는 팀 리더로 성장하여 후배들을 육성하는 역할을 맡고 싶습니다. 글로벌 역량을 갖춘 인재로서 귀사의 해외 사업 확장에도 기여하고 싶습니다.`,
    };
    setContent((prev) => ({ ...prev, [key]: suggestions[key] }));
    setAiLoading(null);
  }

  async function handleExport() {
    setExporting(true);
    await exportToPDF('cover-letter-preview', `cover-letter-${company || 'koreer'}`);
    setExporting(false);
  }

  const totalChars = Object.values(content).join('').length;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Editor */}
      <div className="w-full lg:w-[520px] flex-shrink-0 space-y-4">
        {/* Actions bar */}
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
            Total: <span className="font-medium text-gray-900 dark:text-white">{totalChars}</span> characters
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden"
          >
            Preview
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

        {/* Target info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            Application Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('targetCompany')}
              placeholder="Samsung, Kakao, Naver..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              leftIcon={<Building2 className="w-4 h-4" />}
            />
            <Input
              label={t('targetPosition')}
              placeholder="Software Engineer..."
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.key}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              {/* Section header */}
              <button
                onClick={() => setExpandedSection(
                  expandedSection === section.key ? 'growth' : section.key
                )}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    content[section.key] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  )} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {section.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {content[section.key].length} / {section.maxChars} chars
                    </p>
                  </div>
                </div>
                {expandedSection === section.key ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {/* Expanded content */}
              {expandedSection === section.key && (
                <div className="px-4 pb-4 space-y-3 animate-slide-down">
                  {/* AI tip */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      {section.tip}
                    </p>
                  </div>

                  <Textarea
                    placeholder={section.placeholder}
                    value={content[section.key]}
                    rows={6}
                    onChange={(e) => setContent((prev) => ({ ...prev, [section.key]: e.target.value }))}
                    className="resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-xs',
                      content[section.key].length > section.maxChars
                        ? 'text-red-500'
                        : 'text-gray-400 dark:text-gray-500'
                    )}>
                      {content[section.key].length} / {section.maxChars}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                      loading={aiLoading === section.key}
                      onClick={() => handleAISuggest(section.key)}
                    >
                      {t('aiHelp')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className={cn('flex-1 min-w-0', showPreview ? 'block' : 'hidden lg:block')}>
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h3>
            <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />} loading={exporting} onClick={handleExport}>
              Export PDF
            </Button>
          </div>
          <div id="cover-letter-preview" className="bg-white rounded-2xl shadow-xl overflow-auto max-h-[calc(100vh-12rem)] border border-gray-200">
            <div className="p-10" style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: '12px', lineHeight: '2', color: '#1f2937' }}>
              {/* Header */}
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-8">
                <h1 className="text-xl font-bold tracking-widest">자 기 소 개 서</h1>
                {(company || position) && (
                  <p className="text-sm text-gray-500 mt-1">
                    {company && `${company}`}{company && position && ' · '}{position && `${position} 지원`}
                  </p>
                )}
              </div>

              {/* Sections */}
              {sections.map((section) => (
                <div key={section.key} className="mb-8">
                  <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-600 rounded-full inline-block" />
                    {section.title}
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content[section.key] || (
                      <span className="text-gray-300 italic">내용을 입력하세요...</span>
                    )}
                  </p>
                </div>
              ))}

              {/* Signature */}
              <div className="mt-12 text-center text-xs text-gray-500 border-t pt-6">
                <p>위 사항은 사실과 다름이 없습니다.</p>
                <p className="mt-2">{new Date().toLocaleDateString('ko-KR')} 지원자 (서명)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
