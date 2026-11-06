---
name: persian-ux
description: Build correct Persian (Farsi) user interfaces. Covers RTL layout with logical CSS, Jalali dates, Persian digits, half-space (نیم‌فاصله), Toman/Rial formatting, Iranian mobile numbers, and validation of national ID (کد ملی), bank card and Sheba (IBAN) with @persian-tools/persian-tools. Includes PHP/Laravel equivalents. Use when building or reviewing UI, forms, dates, prices or validation for Persian-speaking or Iranian users, or when the user writes in Persian about frontend work.
---

# Persian UX

Rules for building interfaces for Persian-speaking users in Iran. Apply them to new code, and point them out when you review existing code.

## The main rule: do not reimplement Iranian validators

National ID, bank card, Sheba, mobile number, digit conversion and half-space all have edge cases: checksums, bank prefix tables, operator prefixes, Arabic look-alike characters. Use the libraries below. Never hand-write these checks or regexes.

- JavaScript/TypeScript: `@persian-tools/persian-tools` (checked against 4.0.4).
- PHP/Laravel: `sadegh19b/laravel-persian-validation` for validation, `morilog/jalali` for dates, and the `intl` extension for formatting.

```bash
npm install @persian-tools/persian-tools
```

## 1. RTL layout

Set the direction once at the root. Never set it per element with CSS `direction`.

```html
<html lang="fa" dir="rtl">
```

Use logical CSS properties so the same stylesheet works in RTL and LTR:

| Avoid | Use |
|---|---|
| `margin-left`, `margin-right` | `margin-inline-start`, `margin-inline-end` |
| `padding-left/right` | `padding-inline-start/end`, `padding-inline` |
| `left: 0`, `right: 0` | `inset-inline-start: 0`, `inset-inline-end: 0` |
| `text-align: left/right` | `text-align: start/end` |
| `border-left` | `border-inline-start` |
| `border-top-left-radius` | `border-start-start-radius` |
| `float: left` | `float: inline-start` |

Tailwind: use `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`. Use the `rtl:` and `ltr:` variants only where a logical utility doesn't exist.

Flexbox and grid already follow `dir`. Do not reverse them with `flex-direction: row-reverse` to fake RTL.

**Icons**: mirror only icons that point in a direction, like arrows, "back", "next" and chevrons. Never mirror logos, checkmarks, play buttons, clocks or media controls.

```css
[dir="rtl"] .icon-directional { transform: scaleX(-1); }
```

**Mixed-direction content**:
- User-generated text that can be in any language: `dir="auto"`.
- An inline name or value inside a sentence: `<bdi>`, for example `کاربر <bdi>{username}</bdi> وارد شد`.
- Fields that are always LTR (mobile, card number, Sheba, email, URL, code): `dir="ltr"` on the input, and keep the label RTL.

```html
<label for="mobile">شماره موبایل</label>
<input id="mobile" type="tel" dir="ltr" inputmode="numeric" autocomplete="tel" placeholder="09121234567">
```

**Fonts**: use Vazirmatn, self-hosted (Google Fonts is blocked from Iran; see the `google-fonts` blocklist entry). Do not use `letter-spacing` on Persian text, because it breaks letter joining.

## 2. Persian and Arabic digits

Users type Persian (۰-۹) or Arabic (٠-٩) digits, often mixed with Latin ones. Convert input to Latin digits **before** validating, comparing or saving. Convert to Persian digits only for display.

```js
import { digitsFaToEn, digitsArToEn, digitsEnToFa } from '@persian-tools/persian-tools';

const normalized = digitsArToEn(digitsFaToEn(input.trim())); // store and validate this
const shown = digitsEnToFa('1405/08/15');                     // '۱۴۰۵/۰۸/۱۵'
```

The validators do not accept Persian digits: `verifyIranianNationalId('۰۴۹۹۳۷۰۸۹۹')` returns `false`. Always normalize first.

Also normalize Arabic `ي` and `ك` to Persian `ی` and `ک` before search and comparison:

```js
import { toPersianChars } from '@persian-tools/persian-tools';
toPersianChars('علي كتاب'); // 'علی کتاب'
```

## 3. Half-space (نیم‌فاصله)

A half-space is the zero-width non-joiner, U+200C (ZWNJ). It belongs in words like `می‌خواهم`, `کتاب‌ها` and `خانه‌ای`.

- Write UI copy with a real half-space, never a normal space or no space: `می‌شود`, not `می شود` or `میشود`.
- Clean user text with `halfSpace()`:

```js
import { halfSpace } from '@persian-tools/persian-tools';
halfSpace('نمی خواهم کتاب ها'); // 'نمی‌خواهم کتاب‌ها'
```

- In JS strings, write `‌` when the editor would hide the character.
- Never strip U+200C when sanitizing input or building slugs.

## 4. Jalali dates

Store dates as UTC / Gregorian (ISO 8601 or a timestamp). Convert to Jalali only when displaying, and from Jalali only when parsing user input. Use `Asia/Tehran` as the display time zone.

**Display**: built-in `Intl`, no dependency.

```js
const tz = { calendar: 'persian', timeZone: 'Asia/Tehran' };
new Intl.DateTimeFormat('fa-IR', { ...tz, dateStyle: 'short' }).format(date); // '۱۴۰۵/۸/۱۵'
new Intl.DateTimeFormat('fa-IR', { ...tz, timeStyle: 'short' }).format(date); // '۱۱:۳۰'

// Long dates: build from parts, because the ICU order for the long style varies by runtime.
const p = Object.fromEntries(new Intl.DateTimeFormat('fa-IR', { ...tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  .formatToParts(date).map((x) => [x.type, x.value]));
`${p.weekday} ${p.day} ${p.month} ${p.year}`; // 'جمعه ۱۵ آبان ۱۴۰۵'
```

**Parsing and arithmetic**: `date-fns-jalali`. It has the same API as date-fns, on the Jalali calendar.

```js
import { format, parse, addMonths } from 'date-fns-jalali';
format(date, 'yyyy/MM/dd');                       // '1405/08/15' (Latin digits; wrap with digitsEnToFa to show)
parse('1405/08/15', 'yyyy/MM/dd', new Date());    // a normal Date
addMonths(date, 1);                               // Jalali month arithmetic
```

Never compute Jalali dates by hand (leap years, month lengths). The week starts on Saturday (شنبه), and Friday is the weekend.

Relative time: `timeAgo()` and `remainingTime()` from persian-tools.

## 5. Money: Toman and Rial

- Store amounts as **integers in Rial**. Most payment gateways and banks use Rial, and integers avoid float errors. If a gateway works in Toman, convert at the gateway boundary and comment the unit.
- Show prices in **Toman** (1 Toman = 10 Rial) unless the business shows Rial. Always write the unit; never show a bare number.
- Format with `Intl`, which uses the Persian thousands separator `٬`:

```js
const toman = (rial) => `${new Intl.NumberFormat('fa-IR').format(Math.round(rial / 10))} تومان`;
toman(12500000); // '۱٬۲۵۰٬۰۰۰ تومان'
```

- Do not use `style: 'currency'` with `IRR`. It produces "ریال" with an invisible LRM in the wrong place.
- For amounts in words (invoices, cheques): `numberToWords(1250000)` returns `'یک میلیون و دویست و پنجاه هزار'`.
- For price inputs, show live grouping with `addCommas()` and strip it with `removeCommas()` before saving.

## 6. Iranian mobile numbers

Accept `09121234567`, `9121234567`, `+989121234567`, `00989121234567`, and the same with Persian digits. Normalize to one stored format.

```js
import { digitsFaToEn, isPhoneNumberValid, phoneNumberNormalizer, phoneNumberDetail } from '@persian-tools/persian-tools';

const raw = digitsFaToEn(input.trim());
if (!isPhoneNumberValid(raw)) throw new Error('شماره موبایل معتبر نیست');
const mobile = phoneNumberNormalizer(raw, '0');   // '09121234567'
phoneNumberDetail(mobile).operator;               // 'همراه اول'
```

## 7. National ID, bank card, Sheba

Normalize the digits, then validate. Error messages go in Persian, next to the field.

```js
import { digitsFaToEn, verifyIranianNationalId, verifyCardNumber, getBankNameFromCardNumber, isShebaValid, getShebaInfo } from '@persian-tools/persian-tools';

const nid = digitsFaToEn(value).replace(/\D/g, '');
verifyIranianNationalId(nid);                          // کد ملی: true / false

const card = digitsFaToEn(value).replace(/\D/g, '');
verifyCardNumber(card);                                // شماره کارت
getBankNameFromCardNumber(card);                       // 'بانک کشاورزی'

const sheba = 'IR' + digitsFaToEn(value).replace(/\D/g, '');  // the user may type with or without IR
isShebaValid(sheba);                                   // شماره شبا
getShebaInfo(sheba)?.persianName;                      // 'بانک پارسیان'
```

- Show the bank name or logo as soon as the card or Sheba is valid. Users expect this.
- Card input: `dir="ltr"`, `inputmode="numeric"`, `autocomplete="cc-number"`, grouped in fours for display.
- Validate on the server too. Client-side checks are only for UX.
- National ID, card and Sheba are personal data: do not log them, and mask cards in the UI as `6037-99**-****-7890`.

## 8. PHP and Laravel

**Validation (Laravel)**: `sadegh19b/laravel-persian-validation`, for Laravel 11 or newer and PHP 8.2 or newer.

```bash
composer require sadegh19b/laravel-persian-validation
```

```php
$request->validate([
    'mobile'      => 'required|ir_mobile',
    'national_id' => 'required|ir_national_id',
    'card'        => 'required|ir_bank_card_number',
    'sheba'       => 'required|ir_iban',
    'postal_code' => 'nullable|ir_postal_code',
    'first_name'  => 'required|persian_alpha',
]);

// or rule objects
use Sadegh19b\LaravelPersianValidation\Rules\IranianNationalId;
'national_id' => ['required', new IranianNationalId],
```

Persian digits are rejected by default. Turn on `accept_persian_numbers` in the package config, or normalize the input first (see below).

**Digits (plain PHP)**:

```php
function fa_to_en(string $s): string {
    return strtr($s, ['۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9',
                      '٠'=>'0','١'=>'1','٢'=>'2','٣'=>'3','٤'=>'4','٥'=>'5','٦'=>'6','٧'=>'7','٨'=>'8','٩'=>'9']);
}
```

This is a character map, not a validator, so writing it by hand is fine. For anything with a checksum, use the package.

**Jalali dates**: the `intl` extension for display, and `morilog/jalali` for arithmetic and parsing.

```php
$fmt = new IntlDateFormatter('fa_IR@calendar=persian', IntlDateFormatter::FULL, IntlDateFormatter::NONE,
    'Asia/Tehran', IntlDateFormatter::TRADITIONAL);
echo $fmt->format(new DateTime());          // Persian digits and month names

use Morilog\Jalali\Jalalian;
echo Jalalian::now()->format('Y/m/d');      // 1405/08/15
$g = Jalalian::fromFormat('Y/m/d', '1405/08/15')->toCarbon();  // back to Gregorian
```

**Money**:

```php
$fmt = new NumberFormatter('fa_IR', NumberFormatter::DECIMAL);
echo $fmt->format(intdiv($rial, 10)) . ' تومان';
```

## Review checklist

When you review Persian UI code, check:

- [ ] `<html lang="fa" dir="rtl">` is set; there are no `left`/`right` physical properties in new CSS.
- [ ] Only directional icons are mirrored.
- [ ] LTR fields (mobile, card, Sheba, email) have `dir="ltr"` and the right `inputmode`.
- [ ] Persian and Arabic digits are normalized before validation and storage.
- [ ] Validation uses persian-tools or the Laravel package, not custom regexes.
- [ ] Dates are stored in UTC/Gregorian and shown in Jalali with `Asia/Tehran`.
- [ ] Prices are integers in Rial, shown with their unit (usually Toman) and `٬` grouping.
- [ ] UI copy uses real half-spaces.
- [ ] Fonts are self-hosted; there is no `letter-spacing` on Persian text.
- [ ] National ID, card and Sheba values are not logged.
