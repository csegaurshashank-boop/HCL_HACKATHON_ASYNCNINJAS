# HCL_HACKATHON_ASYNCNINJAS
🔥 WHAT – WHY – HOW Framework

This is exactly how you should explain it in presentation.

1️⃣ WHAT is the problem?
🧾 What are we building?

We are building:

An NLP-based IT Ticket Resolution Suggestion Engine

In simple words:

A smart system that:

Reads a newly raised IT ticket

Searches similar past tickets

Suggests the most relevant resolutions instantly

🧠 What is happening currently?

In companies:

Thousands of IT tickets are raised every month

Many tickets are repetitive (login issues, VPN not working, app crash)

Support engineers manually search old tickets to find similar problems

This process is:

Slow

Manual

Time-consuming

Inefficient

🎯 So WHAT exactly is our solution?

Instead of humans searching manually:

We build a system that:

New Ticket → NLP Similarity Search → Top 3 Suggested Fixes
2️⃣ WHY is this problem important?

This is the most important part.

🚨 Why does this matter?

Because:

✔ 60–70% of IT tickets are repetitive
✔ Manual searching wastes engineer time
✔ Resolution delays reduce employee productivity
✔ Companies lose money due to downtime

🏢 Business Impact

If 1000 tickets/month
and each ticket takes 10 minutes to search manually

That’s:

1000 × 10 min = 10,000 minutes
= 166 hours wasted per month

Your system reduces that search time to:

👉 Few seconds.

That is huge cost saving.

🎯 Why NLP?

Because tickets are written in natural language:

Example:

“VPN not connecting”

“Cannot access office network remotely”

“Remote login failing”

They mean same thing but words are different.

Keyword matching fails.

NLP understands similarity in meaning.

3️⃣ HOW will we solve it?

Now the technical implementation.

🏗 Step 1: Store Historical Data

We create database tables:

Tickets

Resolutions

Users

Status

We need historical tickets because:

Similarity works only if we have past data.

🧠 Step 2: NLP Processing

When new ticket is raised:

🔹 Text Preprocessing

Lowercase

Remove stopwords

Tokenization

🔹 Convert Text to Numbers

Use:

TF-IDF (baseline)
OR

Sentence Embeddings

Because machine understands numbers, not text.

🔹 Compute Similarity

Use:

Cosine Similarity

Compare:

New Ticket Vector
vs
All Historical Ticket Vectors

Find top 3 closest matches.

🔹 Return Resolutions

Fetch resolutions of those top 3 similar tickets.

Return them to user instantly.
💻 FRONTEND FOLDER STRUCTURE (React)
frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TicketCard.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── RaiseTicket.jsx
│   │   ├── Suggestions.jsx
│   │   ├── AdminDashboard.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│
├── package.json
└── vite.config.js
