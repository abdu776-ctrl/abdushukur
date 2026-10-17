# Ovoz Lab

Koreys tili ustozi va bola uchun alohida sayt: ayol ustoz koreyscha soʻraydi,
Oʻzbekistondan kelgan 6–14 yoshli oʻgʻil va qiz bolalar javob beradi — yangi
kelgan bola aksent bilan, Koreyada oʻsgan bola esa ravon, toʻgʻri 존댓말 bilan.

Koreer'dan ajratilgan alohida loyiha: login yoʻq, Supabase yoʻq, faqat shu sahifa.

## Nimalar bor

- Ustoz, bola va ikkinchi bola ovoz kartalari: yozib olish / yuklash, matn
  yozib gapirtirish, ovozni oʻgʻil bola / qiz bola / ustoz ovoziga almashtirish,
  klonlash (pullik tarifda).
- Darajalar (yangi kelgan / oʻrta / ravon), 4 xil javob turi, variantlar.
- Rejimlar: bitta bola, ikki bola (solishtirish), intervyu (har bir savol va
  javobni oʻzingiz yozasiz).
- Dialogni saqlash: bitta umumiy ovozli yozuv (WAV) va matn (TXT), qoʻlda
  yozilgan matnlar roʻyxati.
- Yuqorida holat paneli: qaysi rejimda ishlayapti va ElevenLabs'ning oylik
  bepul kreditidan qancha qoldi.

## 1. Vercel'ga joylash (bepul)

1. <https://vercel.com> → **Add New… → Project** → `abdu776-ctrl/ovoz-lab`
   repozitoriysini tanlang (Import).
2. Sozlamalarni oʻzgartirmang (Framework: Next.js) → **Deploy**.
3. Tayyor boʻlgach manzil chiqadi, masalan `https://ovoz-lab.vercel.app`.
   Kalitsiz ham ishlaydi — bepul ovoz bilan.

## 2. ElevenLabs bepul akkaunt (pullik bilan bir xil sifat, oyiga ~10 daqiqa)

1. <https://elevenlabs.io> da roʻyxatdan oʻting (bepul).
2. **Profile → API Keys → Create** — ruxsatlar: *Text to Speech*,
   *Speech to Speech*, *Voices (read)*, *User (read)* — kredit koʻrinishi uchun.
   Klonlash uchun keyin *Voices (write)* ham kerak boʻladi.
3. **Voices** dan 3 ta ovoz tanlab, har birining **Voice ID** sini oling:
   ayol (ustoz), qiz bolaga oʻxshash, oʻgʻil bolaga oʻxshash. Baʼzi kutubxona
   ovozlari bepul tarifda API orqali ishlamasa, standart ovozlardan tanlang —
   ishlamagan ovoz oʻrniga sayt bepul ovozga oʻtadi va bu yozuvga qoʻshiladi.

## 3. Vercel → Settings → Environment Variables

| Nomi | Nima | Shartmi |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | ElevenLabs kaliti | sifatli ovoz uchun |
| `ELEVENLABS_TEACHER_VOICE_ID` | ustoz ovozi ID | tavsiya |
| `ELEVENLABS_GIRL_VOICE_ID` | qiz bola ovozi ID | tavsiya |
| `ELEVENLABS_BOY_VOICE_ID` | oʻgʻil bola ovozi ID | tavsiya |
| `ACCESS_CODE` | sayt kirish kodi — begonalar kreditingizni sarflamasligi uchun | **kalit qoʻysangiz, albatta** |
| `GROQ_API_KEY` | “AI bilan yaratish” dialoglari (<https://console.groq.com>, bepul) | ixtiyoriy |

Saqlagach **Deployments → Redeploy** qiling. Kalitni hech kimga, hech qayerga
yozmang — faqat Vercel'ga.

## Bepul va pullik

| | Kalitsiz | ElevenLabs bepul | ElevenLabs Starter |
| --- | --- | --- | --- |
| Narx | 0 | 0 | ~$5 / oy |
| Ovoz sifati | oddiy | pullik bilan bir xil | bir xil |
| Hajm | cheklanmagan | ~10 000 belgi / oy | ~30 000 belgi / oy |
| Bolaning oʻz ovozini klonlash | yoʻq | yoʻq | bor |

Kreditni tejash: bir marta eshittirilgan qator saqlanib qoladi — qayta
eshittirish va birlashtirish kredit sarflamaydi. Kod oʻzgarmaydi: pullik
tarifga oʻtsangiz, klonlash oʻzi ochiladi.

## Android ilova (APK)

Ilova jonli saytni ochadi, shuning uchun saytdagi har bir oʻzgarish ilovada
ham darhol koʻrinadi.

1. GitHub → **Actions** → **Android APK** → **Run workflow**.
2. "Site address" ga Vercel manzilingizni yozing (masalan
   `https://ovoz-lab.vercel.app`) → **Run**.
3. 10–15 daqiqadan keyin tugagan ishga kiring va **ovoz-lab-debug-apk** ni
   yuklab oling. Ichidagi `app-debug.apk` ni telefonga oʻrnating (telefon
   "nomaʼlum manbalardan oʻrnatish" ruxsatini soʻraydi).

Ilovada mikrofondan yozish ishlaydi (ruxsat soʻraladi). Yozuvni yuklab olish
tugmalari Android ilovasi ichida ishlamasligi mumkin — saqlash uchun saytni
telefon brauzerida oching.

## Mahalliy ishga tushirish

```bash
cd ovoz-lab
npm install
npm run dev     # http://localhost:3000
```

Kalitlarni `.env.local` ga yozing (u git'ga tushmaydi).
