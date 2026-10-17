# Apex Coin

Apex Coin is a responsive landing page concept for a next-generation cryptocurrency. It presents the project’s features, sample network metrics, a portfolio preview, and a product roadmap in a dark, modern interface.

> The figures and portfolio balance shown on the page are illustrative UI content, not live network or investment data.

## Built with

- [Next.js](https://nextjs.org) App Router and React
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) CLI configuration using Base UI and the Nova preset
- [Lucide](https://lucide.dev/) icons
- [Geist](https://vercel.com/font) fonts

## Getting started

### Prerequisites

- Node.js 20.18.1 or newer
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```text
app/
  globals.css   Tailwind imports, theme tokens, and global styles
  layout.tsx    Root layout, metadata, and Geist fonts
  page.tsx      Apex Coin landing page
lib/
  utils.ts      Shared `cn` class-name utility
```

## shadcn/ui

The project’s shadcn configuration is in [`components.json`](./components.json). To add a component while connected to the shadcn registry, run:

```bash
npx shadcn add button
```

Replace `button` with the component you want to add. Adding registry components requires internet access.

## Production build

```bash
npm run build
npm run start
```
