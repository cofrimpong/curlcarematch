# CurlCare Match Project Specs

## Project Name

CurlCare Match

## Purpose

Build an inclusive hair product recommendation site that helps users across hair types 1A to 4C find beginner-friendly product matches using quiz answers, explainable scoring, and a browsable product library.

## Target Users

- Beginners who do not know where to start with hair products.
- Users who want product suggestions that reflect hair type, porosity, density, and budget.
- Portfolio reviewers evaluating frontend structure, testing, and UI polish.

## Problem Statement

Many haircare shopping experiences are vague, trend-driven, or centered on narrow curl patterns. CurlCare Match makes the selection process more transparent by showing why a product fits and where cautions exist.

## Functional Requirements

- Responsive homepage with clear call to action.
- Quiz page that captures profile inputs and stores them in session storage.
- Results page that ranks products by a 100-point fit score.
- Product library page with filters.
- Hair type guide and porosity/density guide pages.
- Homepage About section describing project goals and visual direction.
- Disclaimer coverage for scalp-related concerns.

## Non-Functional Requirements

- Accessible labels and readable contrast.
- Responsive layout across desktop, tablet, and mobile widths.
- No medical claims.
- JSON-backed data and automated tests.

## Technologies Used

- HTML5
- CSS3
- JavaScript ES modules
- Bootstrap 5
- JSON data files
- Vitest for automated tests
- http-server for local static hosting

## User Stories

- As a user, I want to identify my hair type so I can choose better products.
- As a user, I want product recommendations within my budget.
- As a user, I want to understand why a product was recommended.
- As a user with scalp sensitivity, I want to see ingredient warnings.
- As a student developer, I want automated tests to confirm the recommendation system works.

## Data Structure

- products.json contains product metadata, fit dimensions, ingredients, warnings, and descriptions.
- hair_guides.json contains hair type, porosity, and density reference content.
- _corpus contains future chatbot grounding notes, safety constraints, and retrieval plans.

## Scoring Algorithm

- Hair type match: 20 points
- Porosity match: 20 points
- Density match: 15 points
- Goal match: 20 points
- Budget match: 15 points
- Ingredient fit: 10 points

## Testing Plan

- Scoring tests for direct matches and ingredient conflicts.
- Recommendation tests for ranking and badge mapping.
- Filtering tests for library controls.
- Quiz helper tests for normalization and required fields.
