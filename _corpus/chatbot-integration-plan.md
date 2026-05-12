# Chatbot Integration Plan

## Prerequisite

The chatbot interface should be added only after the core web app passes functional QA and automated tests reliably.

## First Integration Shape

- Add a small assistant panel or dedicated chat page.
- Retrieve only from the local corpus and data files.
- Return answers with product names, fit context, and safety disclaimer when relevant.
- Refuse unsupported answers instead of improvising.

## Success Criteria

- No ungrounded product claims.
- No medical diagnosis language.
- Consistent retrieval from a bounded source.
- Clear fallback when the answer is not in the corpus.
