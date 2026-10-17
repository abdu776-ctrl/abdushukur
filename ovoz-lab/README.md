# Ovoz Lab

Koreys tili ustozi va bola uchun alohida sayt: ayol ustoz koreyscha soʻraydi,
Oʻzbekistondan kelgan 6–14 yoshli oʻgʻil va qiz bolalar javob beradi — yangi
kelgan bola aksent bilan, Koreyada oʻsgan bola esa ravon, toʻgʻri 존댓말 bilan.

Koreer'dan ajratilgan: login yoʻq, Supabase yoʻq, faqat shu sahifa.

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

1. <https://vercel.com> → **Add New… → Project** → `abdu776-ctrl/abdushukur`
   repozitoriysini tanlang.
2. **Root Directory** → `ovoz-lab` ni tanlang. Bu eng muhim qadam: shunda
   Koreer emas, aynan shu sayt joylanadi.
3. **Branch**: hozircha `claude/dreamy-lamport-66eaag` (main'ga qoʻshilgandan
   keyin — `main`).
4. **Deploy**. Kalitsiz ham ishlaydi — bepul ovoz bilan.

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

## Mahalliy ishga tushirish

```bash
cd ovoz-lab
npm install
npm run dev     # http://localhost:3000
```

Kalitlarni `ovoz-lab/.env.local` ga yozing (u git'ga tushmaydi).
