# Supabase email templates (Korean + English)

The confirmation and password-reset emails are sent by Supabase, not by this
codebase, so they do not go through `messages/*.json`. Out of the box they are
the English default template — which a Chinese, Vietnamese, Uzbek or Russian
user receives after signing up on a fully translated page.

These templates are bilingual: Korean first, English second. Everyone living in
Korea reads at least one of the two, and a bilingual email needs no per-language
routing, which the free plan cannot do anyway.

## Where to paste them

Supabase dashboard → **Authentication** → **Emails** → **Templates**

Set both the **Subject** and the **Message body** for each template listed
below. Leave the other templates alone — this app does not use magic links,
invites, or email change.

`{{ .ConfirmationURL }}` is filled in by Supabase. Do not edit it.

---

## 1. Confirm signup

**Subject**

```
[Koreer] 이메일 인증 / Confirm your email
```

**Message body**

```html
<div style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Malgun Gothic',sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">

    <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#4f46e5;">Koreer</p>

    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">이메일 인증</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#374151;">
      Koreer 가입을 환영합니다. 아래 버튼을 눌러 이메일 주소를 인증해 주세요.
      인증 후 이력서와 자기소개서를 저장하실 수 있습니다.
    </p>

    <p style="margin:0 0 28px;">
      <a href="{{ .ConfirmationURL }}"
         style="display:inline-block;padding:12px 24px;border-radius:12px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
        이메일 인증하기 / Confirm email
      </a>
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">

    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Confirm your email</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#374151;">
      Welcome to Koreer. Press the button above to confirm your email address.
      Once confirmed, you can save your resumes and cover letters.
    </p>

    <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
      버튼이 열리지 않으면 아래 주소를 복사해 브라우저에 붙여넣으세요. /
      If the button does not work, copy this link into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
      <a href="{{ .ConfirmationURL }}" style="color:#4f46e5;">{{ .ConfirmationURL }}</a>
    </p>

    <p style="margin:0;font-size:12px;line-height:1.7;color:#9ca3af;">
      본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.<br>
      If you did not create a Koreer account, you can ignore this email.
    </p>
  </div>
</div>
```

---

## 2. Reset password

**Subject**

```
[Koreer] 비밀번호 재설정 / Reset your password
```

**Message body**

```html
<div style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Malgun Gothic',sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">

    <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#4f46e5;">Koreer</p>

    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">비밀번호 재설정</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#374151;">
      비밀번호 재설정 요청을 받았습니다. 아래 버튼을 눌러 새 비밀번호를 설정해 주세요.
      이 링크는 일정 시간이 지나면 만료됩니다.
    </p>

    <p style="margin:0 0 28px;">
      <a href="{{ .ConfirmationURL }}"
         style="display:inline-block;padding:12px 24px;border-radius:12px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
        비밀번호 재설정 / Reset password
      </a>
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">

    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Reset your password</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#374151;">
      We received a request to reset your Koreer password. Press the button above
      to choose a new one. The link expires after a while.
    </p>

    <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
      버튼이 열리지 않으면 아래 주소를 복사해 브라우저에 붙여넣으세요. /
      If the button does not work, copy this link into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
      <a href="{{ .ConfirmationURL }}" style="color:#4f46e5;">{{ .ConfirmationURL }}</a>
    </p>

    <p style="margin:0;font-size:12px;line-height:1.7;color:#9ca3af;">
      본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다. 비밀번호는 변경되지 않습니다.<br>
      If you did not request this, you can ignore this email — your password stays unchanged.
    </p>
  </div>
</div>
```

---

## After pasting

1. Sign up with a test address and check the email that arrives.
2. Press the button — it must land on `/<locale>/dashboard` (signup) or
   `/<locale>/auth/reset-password` (reset). If it lands on `localhost`, fix
   **Authentication → URL Configuration → Site URL** first.
3. Check it on a phone: the layout is a single column, so it should not need
   horizontal scrolling.

## Known limits

- One template serves every language. Supabase's free plan cannot pick a
  template by the user's locale.
- Sending is rate-limited on the free plan. For real volume, connect your own
  SMTP provider under **Authentication → Emails → SMTP Settings** — and at that
  point per-language templates become possible, because the sending is yours.
