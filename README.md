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
- Automated tests with Vitest.

## Tech Stack

- HTML5
- CSS3
- JavaScript ES modules
- Bootstrap 5
- JSON data files
- Vitest
- http-server

## Setup

1. Install dependencies with npm install.
2. Start the local server with npm run dev.
3. Open http://127.0.0.1:4173.

## Firebase Google Sign-In Setup

1. Create a Firebase project and add a Web app.
2. In Firebase Authentication, enable the Google provider.
3. Copy [static/js/firebase-auth-config.example.js](static/js/firebase-auth-config.example.js) to a new local file named static/js/firebase-auth-config.local.js.
4. Replace the placeholder values in that local file with your Firebase web config.
5. In the Firebase console, add http://127.0.0.1:4173 and your deployment origin to Authorized domains.
6. Restart the local server and use the header avatar menu to test Google sign-in.

The local config file is gitignored so your project-specific values stay out of source control.

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
