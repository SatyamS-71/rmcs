// =======================

// WebSocket Connection

// =======================

const ws = new WebSocket(`wss://${location.host}`);

// =======================

// Global State

// =======================

const state = {
  wsid: null,

  roomCode: null,

  players: [],

  yourRole: null,

  isRoomBoss: false,
};

// =======================

// DOM Elements

// =======================

const screenLogin = document.getElementById("screen-login");

const screenRoom = document.getElementById("screen-room");

const screenGame = document.getElementById("screen-game");

const screenResult = document.getElementById("screen-result");

const nameInput = document.getElementById("nameInput");

const roomInput = document.getElementById("roomInput");

const createBtn = document.getElementById("createBtn");

const joinBtn = document.getElementById("joinBtn");

const roomCodeEl = document.getElementById("roomCode");

const playersEl = document.getElementById("players");

const startBtn = document.getElementById("startBtn");

const yourRoleEl = document.getElementById("yourRole");

const guessArea = document.getElementById("guessArea");

// =======================

// WebSocket Handlers

// =======================

ws.onopen = () => {
  console.log("WebSocket connected");
};

ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data);

  handleMessage(type, payload);
};

ws.onerror = (err) => {
  console.error("WebSocket error:", err);
};

ws.onclose = () => {
  console.log("Connection closed");
  alert("Connection closed");
};

// =======================

// Send Helper

// =======================

function send(type, payload) {
  ws.send(JSON.stringify({ type, payload }));
}

// =======================

// Button Actions

// =======================

createBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!name) return alert("Enter name");

  send("create_room", { name });
};

joinBtn.onclick = () => {
  const name = nameInput.value.trim();

  const roomCode = roomInput.value.trim().toUpperCase();

  if (!name || !roomCode) return alert("Enter name and room code");

  send("join_room", { roomCode, name });
};

startBtn.onclick = () => {
  send("start_game", { roomCode: state.roomCode });
};

// =======================

// Message Dispatcher

// =======================

function handleMessage(type, payload) {
  switch (type) {
    case "room_created": {
      state.roomCode = payload.roomCode;

      state.wsid = payload.wsid;

      state.isRoomBoss = true;

      showRoom(payload.roomCode);

      startBtn.hidden = false;

      break;
    }

    case "room_joined": {
      state.roomCode = payload.roomCode;

      state.players = payload.players;

      // determine boss

      if (!state.wsid) {
        const me = payload.players.find((p) => p.name === nameInput.value);

        if (me) state.wsid = me.id;
      }

      updatePlayers();

      showRoom(payload.roomCode);

      break;
    }

    case "roles_assigned": {
      state.yourRole = payload.yourRole;

      state.players = payload.players;

      showGame(payload.yourRole);

      break;
    }

    case "round_result": {
      state.players = payload.roles.map((p) => ({
        id: p.id,

        score: p.score,
      }));

      showResult(payload);

      break;
    }

    default:
      console.warn("Unknown message:", type);
  }
}

// =======================

// UI Functions

// =======================

function showRoom(code) {
  screenLogin.hidden = true;

  screenRoom.hidden = false;

  screenGame.hidden = true;

  screenResult.hidden = true;

  roomCodeEl.textContent = code;
}

function updatePlayers() {
  playersEl.innerHTML = "";

  state.players.forEach((p) => {
    const li = document.createElement("li");

    li.textContent = `${p.name} — ${p.score}`;

    playersEl.appendChild(li);
  });
}

function showGame(role) {
  screenRoom.hidden = true;

  screenGame.hidden = false;

  screenResult.hidden = true;

  yourRoleEl.textContent = role;

  guessArea.innerHTML = "";

  if (role === "Mantri") {
    state.players.forEach((p) => {
      if (p.id === state.wsid) return;

      const btn = document.createElement("button");

      btn.textContent = p.name;

      btn.onclick = () => {
        send("game_move", {
          roomCode: state.roomCode,

          guessedId: p.id,

          MantriId: state.wsid,
        });
      };

      guessArea.appendChild(btn);
    });
  }
}

function showResult(payload) {
  screenGame.hidden = true;

  screenResult.hidden = false;
  console.log("in showResult , the payload is ", payload);

  screenResult.innerHTML = `
<h3>Round Result</h3>
<p>Mantri (${payload.Mantriname}) guessed: ${
    payload.guessedName
  } is the chor </p>
<p color=${payload.wasCorrect ? "Green" : "Red"}>Correct: ${
    payload.wasCorrect
  }</p>
<ul>

      ${payload.roles
        .map((r) => `<li>${r.name} → ${r.role} (${r.score})</li>`)
        .join("")}
</ul>
  `;
  if (state.isroomBoss) {
    startBtn.onclick = () => {
      send("start_game", { roomCode: state.roomCode });
    };
    startBtn.hidden = false;
    startBtn.innerHTML = "Next round";
  }
}
