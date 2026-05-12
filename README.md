# CurlCare Match

CurlCare Match is an inclusive hair product recommendation web app for users across hair types 1A to 4C. It combines a hair profile quiz, a product library, and an explainable scoring model to suggest products by hair fit, budget fit, and ingredient compatibility.

## Features

- Responsive multi-page frontend built with HTML, CSS, JavaScript, and Bootstrap 5.
- Hair profile quiz with session storage.
- Results page with ranked product fit scores out of 100.
- Product library with multi-select filters and budget controls.
- Combined guide page for hair types, porosity, and density.
- Homepage includes the About section and hair type visual overview.
- Grounding-ready _corpus folder for the future chatbot interface.
- LangChain-backed chat route for grounded freeform assistant answers.
- Automated tests with Vitest.

## Tech Stack

- HTML5
- CSS3
- JavaScript ES modules
- Bootstrap 5
- JSON data files
- LangChain JS
- OpenAI via LangChain
- Express
- Vitest

## Setup

1. Install dependencies with npm install.
2. Start the local server with npm run dev.
3. Open http://127.0.0.1:4173.

## LangChain Chat Setup

1. Add OPENAI_API_KEY to your local .env file.
2. Run npm run dev so the Express server can serve both the site and the /api/chat LangChain route.
3. The existing frontend assistant will use the LangChain route for grounded freeform replies and fall back to local rule-based responses if the route is unavailable.

For a live deployment that uses LangChain, deploy this repo to Vercel or another Node-capable host. GitHub Pages alone cannot run the server-side LangChain route.

## Vercel Deployment

1. Import the GitHub repo into Vercel.
2. Keep the framework preset as Other.
3. Do not set a build command.
4. Set the output directory blank so Vercel serves the static site root and the serverless api route together.
5. Add OPENAI_API_KEY in the Vercel project environment variables.
6. Redeploy after the variable is saved.

Vercel will serve the static pages from the repository root and the LangChain endpoint from [api/chat.js](api/chat.js).

## Firebase Google Sign-In Setup

1. Create a Firebase project and add a Web app.
2. In Firebase Authentication, enable the Google provider.
3. Put your Firebase web config into [static/js/firebase-auth-config.js](static/js/firebase-auth-config.js) for deployment, or keep a machine-local override in static/js/firebase-auth-config.local.js during development.
4. In the Firebase console, add localhost, 127.0.0.1, and your deployment origin to Authorized domains.
5. Restart the local server and use the header avatar menu to test Google sign-in.

Firebase web config values are public client-side identifiers, so [static/js/firebase-auth-config.js](static/js/firebase-auth-config.js) can be committed for deployment. The local override file stays gitignored if you want a separate machine-only config.

## Run Tests

- npm test

## Folder Structure

- index.html, quiz.html, results.html, hair-type-guide.html, porosity-density-guide.html, products.html, about.html (redirect)
- static/css and static/js for styling and behavior
- data for products and guide content
- tests for recommendation, filtering, scoring, and quiz coverage
- docs for specs, sprint plan, and QA
- _corpus for future retrieval-grounded chatbot knowledge

## Scoring Algorithm

- Hair type match: 20
- Porosity match: 20
- Density match: 15
- Goal match: 20
- Budget match: 15
- Ingredient fit: 10

## Screenshots

Add screenshots after UI QA and browser checks are complete.

## Disclaimer

CurlCare Match provides general educational product guidance and is not medical advice. For psoriasis, severe irritation, hair loss, or ongoing scalp conditions, users should consult a licensed dermatologist.

## Future Improvements

- Grounded chatbot interface backed by _corpus, products.json, and hair_guides.json
- Vector retrieval layer after core QA passes
- Product comparison view
- Real product API integration

## Current Notes

- The About experience is merged into the homepage and the legacy about route redirects to that section.

## Author

IS219 final project build
