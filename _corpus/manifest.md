# CurlCare Match Corpus Manifest

## Purpose

This folder is reserved for the future chatbot and retrieval layer.

Its job is to reduce hallucinations, memory loss, and drifting by creating a bounded knowledge source that the assistant must stay inside.

## Allowed Grounding Sources

- data/products.json
- data/hair_guides.json
- _corpus/haircare-knowledge.md
- _corpus/safety-rules.md
- _corpus/chatbot-integration-plan.md

## Retrieval Rules

- Prefer exact product and guide matches first.
- Do not answer beyond available source material.
- Do not make medical claims.
- When scalp concerns are mentioned, include the project disclaimer.
- If the corpus does not support an answer, the assistant should say it does not have enough grounded information.
