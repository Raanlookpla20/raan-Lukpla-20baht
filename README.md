# ร้านลูกปลา 20 บาท — เว็บรับออเดอร์ร้านค้า

เว็บแอปพลิเคชันรับออเดอร์สำหรับร้านค้า สร้างด้วย Next.js 15 (App Router) + TypeScript + Tailwind CSS + Prisma
รองรับการเปิดผ่าน LINE LIFF, ชำระเงินด้วยพร้อมเพย์/โอนบัญชี/เก็บเงินปลายทาง, และมีระบบหลังบ้าน (Admin) พร้อม Web Push
Notification แบบ PWA

## สารบัญ

1. [ติดตั้งโปรเจกต์ (Local Development)](#1-ติดตั้งโปรเจกต์-local-development)
2. [ตั้งค่า Environment Variables](#2-ตั้งค่า-environment-variables)
3. [ตั้งค่า LINE LIFF](#3-ตั้งค่า-line-liff)
4. [ตั้งค่า Web Push (VAPID)](#4-ตั้งค่า-web-push-vapid)
5. [ติดตั้งแอดมินบน iPhone (Add to Home Screen)](#5-ติดตั้งแอดมินบน-iphone-add-to-home-screen)
6. [Deploy ขึ้น Vercel](#6-deploy-ขึ้น-vercel)
7. [ตั้งค่าฐานข้อมูล PostgreSQL](#7-ตั้งค่าฐานข้อมูล-postgresql)
8. [โครงสร้างโปรเจกต์](#8-โครงสร้างโปรเจกต์)
9. [หมายเหตุด้านความปลอดภัย](#9-หมายเหตุด้านความปลอดภัย)

---

## 1. ติดตั้งโปรเจกต์ (Local Development)

### สิ่งที่ต้องมี

- Node.js 20 หรือใหม่กว่า
- npm
- ฐานข้อมูล PostgreSQL ที่เข้าถึงได้ (เช่น [Neon](https://neon.tech) หรือ [Supabase](https://supabase.com) มี free tier
  สมัครได้ในไม่กี่นาที, หรือ [Vercel Postgres](https://vercel.com/storage/postgres), หรือรัน Postgres เองผ่าน Docker) —
  โปรเจกต์นี้ใช้ PostgreSQL ทั้ง dev และ production (ดูหัวข้อ 7)

### ขั้นตอน

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. คัดลอกไฟล์ .env.example เป็น .env แล้วกรอกค่าต่างๆ โดยเฉพาะ DATABASE_URL (ดูหัวข้อ 2 และ 7)
cp .env.example .env

# 3. รัน migration เพื่อสร้างตารางในฐานข้อมูล PostgreSQL
npx prisma migrate deploy

# 4. ใส่ข้อมูลตัวอย่าง (หมวดหมู่, สินค้า, บัญชีแอดมิน)
npx prisma db seed

# 5. รันเซิร์ฟเวอร์สำหรับพัฒนา
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000` สำหรับหน้าร้าน และ `http://localhost:3000/admin` สำหรับหลังบ้าน

**บัญชีแอดมินเริ่มต้น (จาก seed):**

- Username: `admin`
- Password: `admin1234`

> ⚠️ เปลี่ยนรหัสผ่านหรือสร้างบัญชีใหม่ก่อนใช้งานจริง (ปัจจุบันยังไม่มีหน้าจัดการบัญชีแอดมินในตัว UI — แก้ไขได้โดยตรงผ่าน
> `npx prisma studio` แล้วอัปเดต `passwordHash` ด้วยค่า bcrypt hash ใหม่ หรือแก้ `prisma/seed.ts` แล้วรันซีดใหม่)

### คำสั่งอื่นๆ ที่มีประโยชน์

```bash
npm run build        # build สำหรับ production
npm run start         # รัน production build
npx prisma studio      # เปิด GUI ดู/แก้ข้อมูลในฐานข้อมูล
npx prisma migrate dev --name <ชื่อ migration>   # สร้าง migration ใหม่หลังแก้ schema.prisma
```

---

## 2. ตั้งค่า Environment Variables

คัดลอก `.env.example` เป็น `.env` แล้วกรอกค่าตามนี้:

| ตัวแปร | คำอธิบาย |
|---|---|
| `DATABASE_URL` | connection string ของฐานข้อมูล PostgreSQL (ดูหัวข้อ 7 สำหรับวิธีเตรียม) |
| `JWT_SECRET` | string สุ่มสำหรับเซ็น session token ของแอดมิน สร้างด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_LIFF_ID` | LIFF ID จาก LINE Developers Console (ดูหัวข้อ 3) — ปล่อยว่างได้ถ้ายังไม่มี |
| `NEXT_PUBLIC_BASE_URL` | URL เต็มของเว็บ (ใช้ทำ Open Graph tags และ LIFF) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | คีย์สำหรับ Web Push (ดูหัวข้อ 4) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | เหมือนกับ `VAPID_PUBLIC_KEY` แต่ต้องมี prefix `NEXT_PUBLIC_` เพื่อให้ฝั่ง client เข้าถึงได้ |
| `STORAGE_PROVIDER` | `local` (เก็บไฟล์ใน `public/uploads`, ใช้ตอน dev) หรือ `vercel-blob` (production) — ถ้าปล่อยว่าง ระบบจะเลือก `vercel-blob` ให้อัตโนมัติเมื่อรันอยู่บน Vercel |
| `BLOB_READ_WRITE_TOKEN` | จำเป็นเมื่อใช้ `vercel-blob` — สร้างจาก Vercel Dashboard → Storage → Create Database → Blob |

ไฟล์ `.env` ที่ commit ไว้ในโปรเจกต์ตัวอย่างนี้มี `JWT_SECRET` และ VAPID keys ที่สุ่มไว้ให้แล้ว (แต่ `DATABASE_URL` ยังเป็น
placeholder ต้องใส่ค่าจริงก่อนรัน) — **ต้องเปลี่ยนค่าทั้งหมดก่อน deploy ขึ้น production จริง**

---

## 3. ตั้งค่า LINE LIFF

LIFF (LINE Front-end Framework) ใช้เพื่อดึงชื่อและรูปโปรไฟล์ LINE ของลูกค้ามา prefill ฟอร์ม checkout อัตโนมัติ
เว็บนี้ทำงานได้ปกติแม้ไม่มี LIFF ID (fallback เปิดผ่านเบราว์เซอร์ทั่วไปได้เลย) — ตั้งค่าเมื่อพร้อมเชื่อมกับ LINE OA จริง

1. เข้า [LINE Developers Console](https://developers.line.biz/console/)
2. สร้างหรือเลือก Provider ที่ต้องการ
3. สร้าง Channel ใหม่ประเภท **LINE Login** (หรือใช้ channel ที่ผูกกับ LINE OA ของร้านอยู่แล้ว)
4. ไปที่แท็บ **LIFF** ในช่องแชนแนล กด **Add**
   - **LIFF app name**: ชื่อที่ต้องการ เช่น "ร้านลูกปลา 20 บาท"
   - **Size**: Full
   - **Endpoint URL**: URL ของเว็บที่ deploy แล้ว เช่น `https://your-shop.vercel.app`
   - **Scope**: เลือก `profile` (จำเป็นสำหรับดึงชื่อ/รูป) และ `openid`
   - **Bot link feature**: เชื่อมกับ LINE OA ของร้าน (ถ้ามี)
5. กด Add แล้วคัดลอก **LIFF ID** ที่ได้ (รูปแบบ `1234567890-AbCdEfGh`)
6. ใส่ค่านี้ใน `.env` / Vercel environment variables ที่ `NEXT_PUBLIC_LIFF_ID`
7. ไปที่หน้า Rich Menu ของ LINE Official Account Manager แล้วตั้งลิงก์ปุ่มเป็น
   `https://liff.line.me/<LIFF_ID>` เพื่อให้กดจาก Rich Menu แล้วเปิดเว็บสั่งซื้อผ่าน LIFF ทันที

---

## 4. ตั้งค่า Web Push (VAPID)

ใช้สำหรับส่ง Push Notification แจ้งเตือนเจ้าของร้านเมื่อมีออเดอร์ใหม่ แม้ไม่ได้เปิดหน้าเว็บ Admin ค้างไว้

### สร้างคีย์

```bash
npx web-push generate-vapid-keys
```

จะได้ผลลัพธ์ประมาณนี้:

```
Public Key: BNbxG...
Private Key: sFxMu...
```

### ใส่ค่าใน .env

```
VAPID_PUBLIC_KEY="BNbxG..."
VAPID_PRIVATE_KEY="sFxMu..."
VAPID_SUBJECT="mailto:your-email@example.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BNbxG..."   # ต้องเป็นค่าเดียวกับ VAPID_PUBLIC_KEY
```

### วิธีเปิดใช้งานในแอป

1. เข้าสู่ระบบแอดมินที่ `/admin`
2. จะเห็นแถบ "เปิดการแจ้งเตือนออเดอร์ใหม่" ที่ด้านบนของทุกหน้า — กด **อนุญาตการแจ้งเตือน**
3. เบราว์เซอร์จะขอสิทธิ์ Notification permission — กด **Allow**
4. กดปุ่ม **ทดสอบส่งการแจ้งเตือน** เพื่อยืนยันว่าระบบทำงานถูกต้อง
5. ตั้งแต่นั้นเมื่อมีลูกค้าสั่งซื้อ จะได้รับ push notification ทันที (มีเลขออเดอร์ ชื่อลูกค้า ยอดรวม เวลาที่สั่ง กดแล้วเปิดหน้า
   ออเดอร์นั้นได้เลย) นอกจากนี้หน้า Admin ที่เปิดค้างไว้จะมีเสียงเตือน + toast แจ้งอัตโนมัติผ่านระบบ polling ทุก 15 วินาที
   ด้วยเช่นกัน

> หมายเหตุ: iOS Safari รองรับ Web Push เฉพาะเมื่อเปิดจากแอปที่ถูก "Add to Home Screen" แล้วเท่านั้น (ดูหัวข้อ 5)

---

## 5. ติดตั้งแอดมินบน iPhone (Add to Home Screen)

iOS/iPhone **ต้อง** เพิ่มเว็บแอดมินไปยังหน้าจอหลักก่อนถึงจะรับ Push Notification ได้ (ข้อจำกัดของ Safari)

1. เปิด **Safari** บน iPhone แล้วไปที่ `https://your-shop.vercel.app/admin`
2. เข้าสู่ระบบด้วยบัญชีแอดมิน
3. กดปุ่ม **แชร์** (ไอคอนสี่เหลี่ยมมีลูกศรชี้ขึ้น) ที่แถบด้านล่าง
4. เลื่อนหาและกด **เพิ่มไปยังหน้าจอโฮม** (Add to Home Screen)
5. ตั้งชื่อ (ค่าเริ่มต้นคือ "Admin ลูกปลา") แล้วกด **เพิ่ม**
6. เปิดแอปจาก **ไอคอนบนหน้าจอหลัก** (ไม่ใช่จาก Safari โดยตรง) แล้วกด **อนุญาตการแจ้งเตือน** ตามขั้นตอนในหัวข้อ 4

---

## 6. Deploy ขึ้น Vercel

1. Push โค้ดขึ้น GitHub/GitLab/Bitbucket repository
2. เข้า [vercel.com](https://vercel.com) → **Add New Project** → เลือก repository นี้
3. ตั้งค่า Environment Variables ในหน้า Vercel project settings ให้ครบทุกตัวตามหัวข้อ 2 โดย:
   - `DATABASE_URL` ให้ใช้ connection string ของ PostgreSQL (ดูหัวข้อ 7)
   - สร้าง Blob store จาก Vercel Dashboard → Storage → Create Database → Blob แล้วคัดลอกค่ามาใส่
     `BLOB_READ_WRITE_TOKEN` (ระบบจะสลับไปใช้ Vercel Blob ให้อัตโนมัติเมื่อรันอยู่บน Vercel แม้ไม่ได้ตั้ง
     `STORAGE_PROVIDER` ก็ตาม — แต่ตั้ง `STORAGE_PROVIDER=vercel-blob` ไว้ให้ชัดเจนก็ได้)
   - `NEXT_PUBLIC_BASE_URL` ตั้งเป็น URL จริงของโปรเจกต์ เช่น `https://your-shop.vercel.app`
   - ใส่ `NEXT_PUBLIC_LIFF_ID`, VAPID keys ตามที่สร้างไว้
4. กด **Deploy**
5. หลัง deploy ครั้งแรกสำเร็จ ให้รัน migration บนฐานข้อมูล production (เลือกวิธีใดวิธีหนึ่ง):
   - รันจากเครื่อง local โดยชี้ `DATABASE_URL` ไปที่ฐานข้อมูล production ชั่วคราว:
     ```bash
     DATABASE_URL="<production-database-url>" npx prisma migrate deploy
     DATABASE_URL="<production-database-url>" npx prisma db seed
     ```
   - หรือเพิ่ม build command เป็น `npx prisma migrate deploy && next build` ใน Vercel project settings
     เพื่อให้ migration รันอัตโนมัติทุกครั้งที่ deploy (แนะนำสำหรับใช้งานระยะยาว)
6. อัปเดต Endpoint URL ของ LIFF app ในหัวข้อ 3 ให้ตรงกับโดเมนจริงที่ deploy

---

## 7. ตั้งค่าฐานข้อมูล PostgreSQL

โปรเจกต์นี้ใช้ PostgreSQL เป็นฐานข้อมูลหลัก (`prisma/schema.prisma` ตั้ง `provider = "postgresql"` ไว้แล้ว) และมี
migration เริ่มต้นอยู่ที่ `prisma/migrations/20260804160000_init/` พร้อมใช้งานทันที ไม่ต้องสร้างใหม่

### เตรียมฐานข้อมูล

เลือกผู้ให้บริการ PostgreSQL ที่ต้องการ เช่น:

- [Vercel Postgres](https://vercel.com/storage/postgres) — ผูกกับโปรเจกต์ Vercel ได้ง่ายที่สุด
- [Neon](https://neon.tech) หรือ [Supabase](https://supabase.com) — มี free tier, ใช้ได้ทั้ง dev และ production
- self-host หรือรันผ่าน Docker สำหรับ local development

คัดลอก connection string มาใส่ที่ `DATABASE_URL` ใน `.env` (local) และใน Vercel project settings (production) — ถ้าใช้
คนละฐานข้อมูลระหว่าง dev/production ให้รัน migration + seed แยกกันทั้งสองฝั่งตามขั้นตอนด้านล่าง

### รัน migration

```bash
npx prisma migrate deploy   # สร้างตารางทั้งหมดตาม migration ที่มีอยู่
npx prisma db seed           # ใส่ข้อมูลตัวอย่าง (ไม่บังคับ)
```

### หากแก้ไข schema เพิ่มเติมในอนาคต

```bash
npx prisma migrate dev --name <ชื่อ migration>
```

คำสั่งนี้ต้องการฐานข้อมูลที่เชื่อมต่อได้จริง (ใช้สร้าง shadow database เพื่อ diff schema) — รันจากเครื่องที่ตั้ง
`DATABASE_URL` ชี้ไปยังฐานข้อมูล dev ที่เข้าถึงได้

---

## 8. โครงสร้างโปรเจกต์

```
prisma/
  schema.prisma        # Database schema (PostgreSQL)
  seed.ts               # ข้อมูลตัวอย่าง: หมวดหมู่, สินค้า, แอดมิน, ตั้งค่าร้าน
src/
  app/
    (storefront)/        # หน้าร้าน: หน้าแรก, สินค้า, ตะกร้า, checkout, ติดตามออเดอร์
    admin/
      login/              # หน้า login แอดมิน (public)
      (dashboard)/         # หน้าหลังบ้านทั้งหมด (ต้อง login) — แดชบอร์ด, สินค้า, หมวดหมู่, โปรโมชั่น, ออเดอร์, ตั้งค่า
    api/
      admin/               # API เฉพาะแอดมิน (ป้องกันด้วย middleware)
      ...                   # API สาธารณะ: products, categories, orders, upload, promptpay-qr
  components/
    storefront/            # Component หน้าร้าน
    admin/                  # Component หลังบ้าน
    ui/                      # Component พื้นฐานใช้ร่วมกัน (Button, Skeleton, Toast, ErrorBoundary)
  lib/                      # Business logic: prisma client, auth, storage, pricing, validations (Zod), ฯลฯ
  store/                    # Zustand stores: cart (persist localStorage), toast
  middleware.ts             # ป้องกันทุก route /admin และ /api/admin ด้วย JWT session
public/
  sw.js                    # Service worker (Web Push + PWA cache)
  manifest.json             # PWA manifest สำหรับแอดมิน
  icons/                    # ไอคอน PWA (สร้างจากโลโก้)
  images/                   # รูป placeholder (โลโก้, แบนเนอร์, สินค้า)
  uploads/                  # ไฟล์ที่อัปโหลด (เมื่อใช้ local storage provider ตอน dev เท่านั้น — production ใช้ Vercel Blob)
```

---

## 9. หมายเหตุด้านความปลอดภัย

- ทุก input จากผู้ใช้ validate ด้วย Zod schema (ใช้ร่วมกันแนวคิดเดียวกันทั้ง client และ server) — ราคา/สต๊อกที่ใช้คำนวณ
  ตอนสั่งซื้อคำนวณจากฐานข้อมูลฝั่ง server เสมอ ไม่เชื่อค่าที่ client ส่งมา
- Route `/admin/*` และ `/api/admin/*` ทั้งหมดถูกป้องกันด้วย middleware ตรวจ JWT session cookie (`httpOnly`, `secure`
  ใน production)
- รหัสผ่านแอดมิน hash ด้วย bcrypt (ไม่เก็บ plain text)
- Rate limit ถูกใส่ไว้ที่ endpoint ที่เสี่ยงถูกสแปม: สร้างออเดอร์ (`POST /api/orders`), อัปโหลดสลิป
  (`POST /api/upload/slip`), และ login แอดมิน (`POST /api/admin/auth/login`) — ระบบ rate limit เป็นแบบ in-memory
  เหมาะกับ deployment ขนาดเล็ก-กลาง หากต้องรองรับหลาย instance พร้อมกันแนะนำเปลี่ยนไปใช้ Redis-backed limiter
- ค่าที่เป็นความลับทั้งหมด (DB URL, JWT secret, VAPID keys, Blob token) อ่านจาก environment variables เท่านั้น
  ไม่ hardcode ในโค้ด — ดู `.env.example` สำหรับรายการทั้งหมด
- ก่อน deploy ใช้งานจริง **ต้องเปลี่ยน** `JWT_SECRET`, VAPID keys, รหัสผ่านแอดมินเริ่มต้น, และเลขพร้อมเพย์/บัญชีธนาคาร
  (ตั้งค่าได้ที่หน้า Admin → ตั้งค่า) จากค่าตัวอย่างที่ให้มาในโปรเจกต์นี้
