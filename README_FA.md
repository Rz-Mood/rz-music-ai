# RZ Mood v5 — Cloudflare Worker Edition

## امکانات
- پنل‌های شیشه‌ای و طراحی واکنش‌گرا
- فارسی و انگلیسی با RTL/LTR
- چهار تم: RZ Mood، Ocean Glass، Violet Night و Sunset
- جست‌وجوی آهنگ و هنرمند مشابه از طریق Cloudflare Worker
- اشتراک‌گذاری، کپی عنوان و بازکردن منبع در تب جدید
- دانلود فقط در صورت وجود لینک مستقیم مجاز `download_url` یا `audio_url`
- PWA برای ویندوز و اندروید

## اتصال Cloudflare
در `app.js` مقدار `WORKER_BASE_URL` را با آدرس واقعی Worker خودتان جایگزین کنید.
در Cloudflare Worker باید Secret با نام `MUSICATLAS_API_KEY` در محیط Production تنظیم شده باشد.

Worker باید مسیرهای `POST /similar_tracks` و `POST /similar_artists` را بپذیرد و CORS را برای مبدا GitHub Pages این پروژه فعال کند.

## انتشار
تمام فایل‌های این پوشه را در ریشه مخزن GitHub Pages آپلود و فایل‌های قبلی را جایگزین کنید، سپس Commit changes بزنید. پس از انتشار سایت را با Ctrl+F5 تازه‌سازی کنید.

## نکته مهم
MusicAtlas/Spotify لزوماً فایل صوتی قابل دانلود ارائه نمی‌کنند. این برنامه لینک Spotify را به فایل صوتی تبدیل نمی‌کند و دانلود تنها برای لینک مستقیم موجود در داده نتیجه فعال می‌شود.
