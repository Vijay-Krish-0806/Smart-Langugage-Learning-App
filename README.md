# 🌍 AI-Powered Language Learning SaaS

A full-stack, gamified language learning platform inspired by Duolingo — enhanced with AI using Google Gemini API to dynamically generate lessons, adapt to user progress, and deliver a personalized experience.

---

## 🚀 Features

- 🎯 Learn from scratch to advanced in multiple languages
- ❤️ Hearts system: lose hearts for wrong answers
- 🌟 XP & Points: level up as you progress
- 🔐 Auth with Clerk
- 💳 Pro subscription for unlimited hearts (Stripe)
- 🧠 **AI-generated lessons via Google Gemini**
- 🔁 Regain hearts by reviewing old lessons
- 🛍 Exchange XP for hearts in the shop
- 🏆 Leaderboard to track top users
- 📊 Admin dashboard to manage courses, units & lessons
- 🗺 Quest map for progress milestones
- 📱 Mobile responsive & production-ready

---

## 🧠 AI Integration (Gemini API)

> Powered by [Google Gemini API](https://ai.google.dev)

- Dynamic JSON lesson generation
- AI-driven content tailored to user’s progress
- Used for generating challenges, options, images (future), etc.

---

## 🧱 Tech Stack

| Tech                  | Usage                                  |
| --------------------- | -------------------------------------- |
| **Next.js 14**        | Frontend + API routes (server actions) |
| **TypeScript**        | Type safety across the full stack      |
| **Tailwind CSS**      | Modern UI styling                      |
| **Shadcn UI**         | Reusable and elegant components        |
| **Clerk**             | Authentication                         |
| **Stripe**            | Payments (Pro Tier)                    |
| **Drizzle ORM**       | Type-safe DB access                    |
| **PostgreSQL (Neon)** | Cloud database                         |
| **Vercel**            | Deployment                             |
| **Gemini API**        | AI-based lesson generation             |

---

## 🧑‍💻 Local Setup

```bash
git clone https://github.com/Vijay-Krish-0806/smart-language-learning-app.git
cd smart-language-learning-app
npm install
```
