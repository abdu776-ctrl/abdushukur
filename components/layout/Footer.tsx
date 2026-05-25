import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Koreer</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              AI-powered career tools for international students pursuing opportunities in Korea.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
            <ul className="space-y-3 text-sm">
              {['Resume Builder', 'Cover Letter', 'AI Assistant', 'Templates', 'PDF Export'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Languages</h4>
            <ul className="space-y-3 text-sm">
              {[
                { flag: '🇺🇸', name: 'English' },
                { flag: '🇰🇷', name: '한국어' },
                { flag: '🇺🇿', name: "O'zbek" },
                { flag: '🇷🇺', name: 'Русский' },
              ].map((lang) => (
                <li key={lang.name}>
                  <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
                    <span>{lang.flag}</span> {lang.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Students */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">For Students From</h4>
            <ul className="space-y-3 text-sm">
              {[
                { flag: '🇺🇿', name: 'Uzbekistan' },
                { flag: '🇰🇿', name: 'Kazakhstan' },
                { flag: '🇰🇬', name: 'Kyrgyzstan' },
                { flag: '🇲🇳', name: 'Mongolia' },
                { flag: '🇻🇳', name: 'Vietnam' },
              ].map((country) => (
                <li key={country.name} className="flex items-center gap-2">
                  <span>{country.flag}</span> {country.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            © {currentYear} Koreer. Built with ❤️ for international students in Korea.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
