# CurlCare Match

CurlCare Match is an inclusive hair product recommendation web app for people across hair types 1A through 4C. It helps a user build a hair profile, browse real products, avoid unwanted ingredients, and receive explainable recommendations based on fit, budget, and hair goals.

This repository is intended to be clean, understandable, and submission-ready for an IS219 final project review.

Live site: https://curlcarematch.vercel.app/

## What This Project Is

CurlCare Match combines a multi-page frontend with recommendation logic, user profile persistence, and a grounded assistant experience. A user can:

- learn about hair type, porosity, and density
- build a profile through the quiz or chat assistant
- save profile preferences and ingredient avoids
- view matched products with explanations and scores
- browse a full product library
- sign in with local email/password or Google when configured

## Why This Project Exists

Haircare advice is often inconsistent, hard to personalize, or not inclusive of the full 1A to 4C range. This project was built to demonstrate a more structured and beginner-friendly approach: guide the user through core hair profile choices, connect those choices to product data, and explain why a product is being recommended instead of returning a black-box result.

## What This Project Demonstrates

This project was designed to demonstrate these skills and technologies:

- frontend development with HTML, CSS, JavaScript, and Bootstrap
- responsive UI and multi-page navigation
- form handling and profile collection
- recommendation and scoring logic using JSON-based product data
- automated testing with Vitest
- authentication flows with local account storage and optional Firebase Google sign-in
- grounded AI assistant behavior using LangChain on a server-side chat route
- deployment setup for Vercel

## Main Features

- Multi-page frontend for homepage, quiz, results, guides, and product library
- Profile-based product matching with a visible score out of 100
- Product filters for goals, budgets, product types, and compatibility
- Ingredient avoid handling, including multiple avoided ingredients
- Sitewide assistant with minimized, expanded, and fullscreen states
- User-scoped persistence for profile and assistant state
- Grounding-ready `_corpus` folder for assistant knowledge support
- Automated test coverage for scoring, recommendations, quiz logic, auth helpers, and chatbot helpers

## Tech Stack

- HTML5
- CSS3
- JavaScript ES modules
- Bootstrap 5
- Node.js
- Express
- LangChain JS
- OpenAI via LangChain
- Vitest
- JSON data files
- Vercel serverless function support

## Project Structure

- `index.html`, `quiz.html`, `results.html`, `products.html`, `hair-type-guide.html`, `porosity-density-guide.html`: main user-facing pages
- `static/css`: site styling
- `static/js`: frontend behavior, quiz logic, auth, storage, recommendations, and assistant logic
- `data`: product and guide datasets
- `api`: serverless chat endpoint for deployment
- `lib`: LangChain chat implementation
- `tests`: automated tests
- `docs`: planning and QA notes
- `_corpus`: grounding content used to reduce drift and hallucinated assistant responses

## Prerequisites

Before running the project locally, make sure you have:

- Node.js 18 or newer
- npm

Optional setup for advanced features:

- an `OPENAI_API_KEY` in a local `.env` file if you want the server-side LangChain chat route to respond
- Firebase web app configuration if you want Google sign-in enabled

## How To Run The Project

If you want to review the deployed version instead of running locally, use https://curlcarematch.vercel.app/.

### Full local app

Use this mode for the complete experience, including the Express server and chat API route.

1. Install dependencies with `npm install`.
2. Create a `.env` file and add `OPENAI_API_KEY=your_key_here` if you want LangChain responses enabled.
3. Start the app with `npm run dev`.
4. Open `http://127.0.0.1:4173` in the browser.

### Static-only frontend preview

Use this mode if you only want to preview the frontend pages without the Node server.

1. Install dependencies with `npm install`.
2. Start the static server with `npm run dev:static`.
3. Open `http://127.0.0.1:4173` in the browser.

In static-only mode, the site UI still loads, but the server-side LangChain chat route is not available.

## How To Run The Tests

Run all automated tests with:

- `npm test`

Current automated test files include:

- `tests/recommendation.test.js`
- `tests/scoring.test.js`
- `tests/filtering.test.js`
- `tests/quiz.test.js`
- `tests/auth.test.js`
- `tests/chatbot.test.js`

## LangChain And Grounded Assistant Notes

The assistant uses two layers:

- client-side logic for profile editing, ingredient updates, and page-aware guidance
- a server-side LangChain route for grounded freeform responses

The `_corpus` folder exists to support more grounded assistant behavior and reduce hallucinations, drift, and memory loss. If the `/api/chat` route is unavailable, the frontend falls back to local rule-based behavior for supported actions.

## Authentication Notes

The project supports:

- local email/password account flows stored in the browser
- Google sign-in through Firebase when Firebase configuration is provided

If Firebase is not configured, the rest of the app still works and the local auth flow remains available.

## Vercel Deployment

This repo is set up so the static frontend and the serverless chat route can be deployed together on Vercel.

1. Import the GitHub repository into Vercel.
2. Use the `Other` framework preset.
3. Leave the build command empty.
4. Leave the output directory empty.
5. Add `OPENAI_API_KEY` as an environment variable.
6. Deploy.

The static site is served from the repository root, and the assistant API route is served from `api/chat.js`.

## Scoring Overview

The recommendation score is based on weighted hair profile compatibility:

- Hair type match: 20
- Porosity match: 20
- Density match: 15
- Goal match: 20
- Budget match: 15
- Ingredient fit: 10

## Disclaimer

CurlCare Match provides general educational product guidance and is not medical advice. For psoriasis, severe irritation, hair loss, or ongoing scalp conditions, users should consult a licensed dermatologist.

## Reviewer Summary

For a reviewer, the key things to know are:

- this is a full project repository, not just a design mockup
- the repo includes source code, automated tests, and local run instructions
- the deployed version is available at https://curlcarematch.vercel.app/
- the project demonstrates frontend engineering, recommendation logic, testing, deployment setup, and a grounded LangChain integration
- the app is meant to show both practical web development skills and a polished, portfolio-ready product experience
