# RMCS – Raja Mantri Chor Sipahi 🎮

A real-time multiplayer implementation of the classic Indian game **Raja–Mantri–Chor–Sipahi**, built using **Node.js**, **WebSockets**, and **vanilla frontend technologies**.

The project focuses on learning and implementing **real-time systems**, **state management**, and **fair multiplayer game logic**, while keeping the stack simple and understandable.

---

## 🚀 About the Game

Raja–Mantri–Chor–Sipahi is a deduction-based game where:

* One player is the **Raja** (King)
* One player is the **Mantri** (Minister)
* One player is the **Chor** (Thief)
* Remaining players are **Sipahi** (Soldiers)

The Mantri must correctly identify the Chor. Points are awarded based on roles and the outcome of the guess.

This digital version supports **multiple players**, **real-time gameplay**, and is playable via:

* Web browsers
* Terminal-based WebSocket clients
* Mobile apps (future-ready)

---

## 🧱 Tech Stack

### Backend

* Node.js
* `ws` (WebSocket server)
* In-memory room & game state

### Frontend

* HTML
* CSS
* Vanilla JavaScript
* WebSocket client

### Optional Integrations

* GIF / Meme APIs (GIPHY / Tenor – planned)
* Animation libraries (anime.js / GSAP – planned)

---

## ✅ Implemented Features

### Multiplayer & Networking

* WebSocket-based real-time communication
* Room creation and joining via room codes
* Room host (Room Boss) control

### Game Logic

* Supports **4 or more players**
* Exactly:

  * 1 Raja
  * 1 Mantri
  * 1 Chor
  * Multiple Sipahi
* Secure server-side role assignment
* Role-based scoring:

  * Raja bonus
  * Sipahi bonus
  * Guess-based rewards

### Gameplay Flow

* Start game only when minimum players are present
* Private role assignment per player
* Mantri guessing logic
* Clear round result screen with:

  * Player names
  * Roles
  * Scores

### Frontend UX

* Clean screen-based UI flow
* Real-time player list updates
* Human-readable result screen
* Ready for animations & media

---

## 🧠 Design Decisions

* **Server authoritative game logic** (no trust in frontend)
* **Multiple Sipahi model** to support scalable multiplayer
* **Frontend-only media handling** (no backend bloat)
* **Message-driven architecture** using WebSockets

---

## 🛠️ Features Planned / To Be Implemented

### High Priority

* 🔒 Prevent Mantri from guessing more than once per round (server-side flag)
* 🔁 Multi-round gameplay without page reload
* 🔌 Handle player disconnects mid-round

### Media & UX Enhancements

* 🎭 Role-based meme GIFs on role reveal
* 🔄 GIF refresh option per player
* ✨ Animations for role reveal and results
* 🔊 Sound effects for game events

### Technical Improvements

* 🔑 Proper frontend API key handling using environment variables
* ⚙️ Caching of external API responses
* 📱 Mobile-friendly UI

### Optional / Advanced

* 👤 Player reconnection support
* 📊 Leaderboard
* 💾 Persistent scores (database-backed)
* 🔐 Authentication layer

---

## ▶️ How to Run (Local)

```bash
npm install
node index.js
```

Open multiple browser tabs or WebSocket clients and connect to:

```
ws://localhost:8010
```

---

## 📌 Notes

* This project is intentionally kept framework-light to focus on fundamentals
* All game rules are enforced on the server
* Frontend logic is replaceable (React / Android / CLI clients)

---

## 📚 Learning Goals

* Real-time systems with WebSockets
* Multiplayer game state design
* Server-side rule enforcement
* Clean frontend-backend separation
* Production-oriented thinking

---

## 🧑‍💻 Author

Built as a learning-first multiplayer project, with emphasis on correctness, scalability, and clarity.

---

*Classic game. Modern implementation.*
