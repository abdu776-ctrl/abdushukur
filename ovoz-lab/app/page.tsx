import { AudioLines } from 'lucide-react';
import { StatusBar } from '@/components/StatusBar';
import { VoiceLab } from '@/components/voice-lab/VoiceLab';

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center">
            <AudioLines className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">
            Ovoz Lab <span className="font-normal text-gray-500 dark:text-gray-400">· koreys tili ustozi va bola</span>
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
          Ayol ustoz koreyscha savol beradi, Oʻzbekistondan kelgan 6–14 yoshli oʻgʻil va qiz bolalar javob beradi —
          yangi kelgan bola aksent bilan, Koreyada oʻsgan bola esa ravon, toʻgʻri 존댓말 bilan.
        </p>
      </header>
      <StatusBar />
      <VoiceLab />
    </main>
  );
}
