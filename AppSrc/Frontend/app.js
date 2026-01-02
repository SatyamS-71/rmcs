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

  playername: null,
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

const nextround = document.getElementById("Next round");

const sendChtbtn = document.getElementById("sendChatBtn");

const chatinput = document.getElementById("chatText");

const chatscreen = document.getElementById("chat-messages");
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

// Button Actions and event listeners

// =======================

createBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!name) return alert("Enter name");
  state.playername = name;
  send("create_room", { name });
};

joinBtn.onclick = () => {
  const name = nameInput.value.trim();
  state.playername = name;
  const roomCode = roomInput.value.trim().toUpperCase();

  if (!name || !roomCode) return alert("Enter name and room code");

  send("join_room", { roomCode, name });
};

startBtn.onclick = () => {
  send("start_game", { roomCode: state.roomCode });
};

nextround.onclick = () => {
  send("start_game", { roomCode: state.roomCode });
};

sendChtbtn.onclick = () => {
  const msgtosend = chatinput.value.trim();
  if (!msgtosend || !state.roomCode || !state.playername)
    return console.log(
      `empty values , msgtosend: ${msgtosend}  or roomcode: ${state.roomCode}  or playename: ${state.playename}`
    );

  send("room_chat", {
    roomCode: state.roomCode,
    message: msgtosend,
    msgby: state.playername,
  });
  chatinput = null;
};

chatinput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const msgtosend = chatinput.value.trim();
    if (!msgtosend || !state.roomCode || !state.playername)
      return console.log(
        `empty values , msgtosend: ${msgtosend}  or roomcode: ${state.roomCode}  or playename: ${state.playename}`
      );

    send("room_chat", {
      roomCode: state.roomCode,
      message: msgtosend,
      msgby: state.playername,
    });
    chatinput = null;
  }
});
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

    case "Broadcast_msg": {
      chatscreenupdate(payload);
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

  nextround.hidden = true;

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

function chatscreenupdate(payload) {
  //`chatscreen` is the div that will contain all the messages
  /* payload is 
              
              payload: {
                brdcastby: msgby,
                brdcastmsg: message,
              },
            
      */
  //make element with the msg to be displayed
  const chatblock = document.createElement("div");
  const sender = document.createElement("div");
  const msg = document.createElement("div");

  chatblock.appendChild(sender);
  chatblock.appendChild(msg);
  //added the payload values to the html element

  sender.textContent = `${payload.brdcastby}`;
  msg.textContent = `${payload.brdcastmsg}`;

  //styling
  chatblock.className = "chat-block";
  sender.className = "chat-sender";
  msg.className = "chat-message";
  if (payload.brdcastby === state.playername) {
    chatblock.classList.add("self");
  }
  if (payload.brdcastby === state.roomCode) {
    sender.style.color = "Red";
  }
  chatscreen.appendChild(chatblock);

  chatscreen.scrollTop = chatscreen.scrollHeight;
}

/*
function showResult(payload) {
  screenGame.hidden = true;

  screenResult.hidden = false;
  console.log("in showResult , the payload is ", payload);

  screenResult.innerHTML = `
<h3>Round Result</h3>
<p>Mantri (${payload.Mantriname}) guessed: ${
    payload.guessedName
  } is the chor </p>
<p color= \"${payload.wasCorrect ? "Green" : "Red"}\">Correct: ${
    payload.wasCorrect
  }</p>
<ul>

      ${payload.roles
        .map((r) => `<li>${r.name} → ${r.role} (${r.score})</li>`)
        .join("")}
</ul>
  `;

  console.log("is the roomBoss true?", state.isRoomBoss);
  if (state.isRoomBoss) {
    nextround.hidden = false;
  }
}
*/

function showResult(payload) {
  screenGame.hidden = true;
  screenResult.hidden = false;

  const header = document.createElement("h3");
  header.textContent = "Round Result";

  const result = document.createElement("p");
  result.textContent = `Mantri (${payload.Mantriname}) guessed: ${payload.guessedName}`;

  const resultboolean = document.createElement("p");
  resultboolean.textContent = payload.wasCorrect
    ? "Correct choice"
    : "Incorrect choice";
  resultboolean.style.color = payload.wasCorrect ? "Green" : "Red";

  const unslist = document.createElement("ul");

  payload.roles.forEach((r) => {
    const litems = document.createElement("li");
    litems.textContent = `[${r.role}]${r.name} = ${r.score}`;
    unslist.appendChild(litems);
  });

  screenResult.appendChild(header);
  screenResult.appendChild(result);
  screenResult.appendChild(resultboolean);
  screenResult.appendChild(unslist);

  if (state.isRoomBoss) {
    nextround.hidden = false;
  }
}
