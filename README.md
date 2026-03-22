<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite" />
  <img src="https://img.shields.io/badge/Claude-AI-blueviolet?style=for-the-badge" />
</p>

<h1 align="center">💜 PulseQ</h1>

<p align="center">
  <b>Your AI-powered customer retention dashboard.</b><br/>
  Know who's slipping away — and win them back.
</p>

---

## ✨ What is Pulse?

Pulse watches your customer data, spots churn risks before they happen, and helps you write the perfect win-back message — all from one beautiful dashboard.

- 📊 **Smart Dashboard** — see who needs attention at a glance
- 🔊 **Daily Audio Briefing** — AI-generated spoken summary of your business
- 💌 **AI Outreach** — personalized emails, phone scripts & offers
- 🏷️ **Live Pricing Intel** — competitive price comparisons
- 🗃️ **SQLite-backed** — all your data in one tidy `.db` file

---

## 🛠️ Requirements

- [Node.js](https://nodejs.org/) (v18+)

---

## 🔐 Environment Setup

Create a `.env` file in the root directory:

```env
ANTHROPIC_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Seed the database
npm run seed

# 3. Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and say hi to your customers 👋

---

<p align="center"><sub>built with 💜 and too much coffee</sub></p>
