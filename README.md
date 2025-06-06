# Bryan Gan's Portfolio

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Component Breakdown](#component-breakdown)
6. [Getting Started](#getting-started)
7. [Available Scripts](#available-scripts)
8. [Deployment](#deployment)
9. [Customization & Theming](#customization--theming)
10. [Contributing](#contributing)
11. [License](#license)

---

## Project Overview

This repository contains a personal portfolio website built with **Astro**. It showcases:

* An engaging **Hero** section with a brief introduction
* A detailed **About** section outlining skills and background
* A concise **Experience** timeline highlighting professional roles
* A dynamic **Projects** gallery of key work samples
* A **Contact** section with a form and social links
* Shared UI primitives (`Button`, `Card`, `Section`, `Header`, `Footer`) for consistency

The site is fully responsive and optimized for performance and SEO out of the box.

## Key Features

* **Static Site Generation**: lightning-fast builds and delivery via Astro
* **Component-driven**: reusable `.astro` components
* **Responsive Design**: mobile-first, built with utility‑first CSS (e.g., Tailwind)
* **SEO Ready**: semantic markup, meta tags, and sitemap support
* **Accessibility**: ARIA attributes and keyboard navigation

## Tech Stack

* **Framework**: [Astro](https://astro.build)
* **Styling**: Tailwind CSS (or your preferred utility‑first engine)
* **Markdown Support**: MDX or plain `.md` for blog/content pages
* **Assets**: Optimized images with Astro `<Image>` component
* **Deployment**: Netlify, Vercel, or any static host

## Project Structure

```
/├── public/               # Static assets (images, icons, fonts)
   └── favicon.svg
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Hero.astro
│   │   ├── About.astro
│   │   ├── Experience.astro
│   │   ├── Projects.astro
│   │   ├── Contact.astro
│   │   ├── Button.astro
│   │   ├── Card.astro
│   │   ├── Section.astro
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── layouts/          # Page layouts (e.g., default layout)
│   └── pages/            # Route-driven pages
│       └── index.astro   # Landing page assembling components
├── astro.config.mjs      # Astro configuration file
├── tailwind.config.cjs   # Tailwind configuration (if used)
├── package.json          # Dependencies & scripts
└── README.md             # This file
```

## Component Breakdown

> **Hero.astro**
>
> * Top-of-page introduction with name, role/title, and a call-to-action.

> **About.astro**
>
> * Detailed personal summary, skills list, and core strengths.

> **Experience.astro**
>
> * Chronological timeline of past roles, companies, and durations.

> **Projects.astro**
>
> * Grid of project cards showcasing titles, descriptions, and links.

> **Contact.astro**
>
> * Contact form and social media links (email, GitHub, LinkedIn).

> **Button.astro**
>
> * Standardized button component for links and form submissions.

> **Card.astro**
>
> * Reusable card layout for projects, blog posts, or feature highlights.

> **Section.astro**
>
> * Wrapper with consistent padding/margins and optional background.

> **Header.astro** & **Footer.astro**
>
> * Site navigation, logo, copyright, and footer links.

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/portfolio.git
   cd portfolio
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create a `.env` file**

   ```bash
   cp .env.example .env
   ```

   Add your Web3Forms access key to `WEB3FORMS_ACCESS_KEY` in the new `.env` file.

4. **Run development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   * Open [http://localhost:3000](http://localhost:3000) to view in your browser.

## Available Scripts

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Start Astro in development mode         |
| `npm run build`   | Build production assets into `dist/`    |
| `npm run preview` | Preview the production build locally    |
| `npm run lint`    | Lint your code (ESLint, Prettier, etc.) |

## Deployment

1. **Build**

   ```bash
   npm run build
   ```

2. **Deploy**

   * Push the `dist/` folder to your static host of choice:

     * **Netlify**: drag & drop, or connect GitHub repo
     * **Vercel**: `vercel` CLI or GitHub integration
     * **GitHub Pages**: use `gh-pages` branch

## Customization & Theming

* **Colors & Typography**: edit `tailwind.config.cjs` or global CSS
* **Metadata**: update `<head>` tags in `src/layouts/default.astro`
* **Content**: modify texts in each section component
* **Images**: replace assets in `public/` and adjust references

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: \`git commit -m "Add YourFeature"
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

## License

This project is licensed under the **MIT License**.

---

*Last updated: May 6, 2025*

Template used: https://astro.build/themes/details/front-end-developer-theme/
