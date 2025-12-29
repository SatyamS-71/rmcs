const express = require("express");
const http = require("http");
const path = require("path");
const { WebSocketServer } = require("ws");
const { randomUUID } = require("crypto");
const { inspect } = require("util");

const PORT = process.env.PORT || 8010;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "Frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend", "index.html"));
});
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
server.listen(PORT, () => {
  console.log(`WebSocket + HTTP server is running on ws://localhost:${PORT}`);
});

const rooms = {};
// Structure: { roomCode: { players: [{ id, name, ws, score, role }], roomBoss } }

wss.on("connection", (ws) => {
  ws.id = randomUUID();
  console.log(
    `###New connection event occurred, a player might have connected: \n ${inspect(
      ws.id,
      { showHidden: false, depth: 1, colors: true }
    )}`
  );

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      console.error("Invalid JSON:", message);
      return;
    }

    const { type, payload } = data;
    console.log(data);

    /** Helper: shuffle and assign roles */
    // function shuffleAndAssignRoles(room) {
    //   const roles = ["Raja", "Mantri", "Chor", "Sipahi"];
    //   if (room.players.length !== 4) {
    //     throw new Error("Exactly 4 players required");
    //   }
    //   for (let i = roles.length - 1; i > 0; i--) {
    //     const j = Math.floor(Math.random() * (i + 1));
    //     [roles[i], roles[j]] = [roles[j], roles[i]];
    //   }

    //   room.players.forEach((player, idx) => {
    //     player.role = roles[idx];
    //     if (player.role === "Raja") player.score += 1000;
    //     if (player.role === "Sipahi") player.score += 500;
    //   });
    // }

    function shuffleAndAssignRoles(room) {
      const playerCount = room.players.length;

      if (playerCount < 4) {
        throw new Error("At least 4 players required");
      }

      // Clear previous roles
      room.players.forEach((p) => (p.role = null));

      // Shuffle players
      const shuffled = [...room.players];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Assign fixed roles
      shuffled[0].role = "Raja";
      shuffled[1].role = "Mantri";
      shuffled[2].role = "Chor";

      // Everyone else is Sipahi
      for (let i = 3; i < shuffled.length; i++) {
        shuffled[i].role = "Sipahi";
      }

      // Base score bonuses (once per round)
      shuffled.forEach((player) => {
        if (player.role === "Raja") player.score += 1000;
        if (player.role === "Sipahi") player.score += 500;
      });
    }

    /** Helper: update a player's score */
    function updatePlayerScore(roomCode, playerId, score) {
      rooms[roomCode].players.forEach((player) => {
        if (player.id === playerId) {
          player.score += score;
        }
      });
    }

    /** Handle different message types */
    switch (type) {
      case "create_room": {
        console.log("create event request received..");
        const roomCode = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

        rooms[roomCode] = {
          players: [{ id: ws.id, name: payload.name, ws, score: 0 }],
          roomBoss: ws.id,
        };

        ws.send(
          JSON.stringify({
            type: "room_created",
            payload: { roomCode, wsid: ws.id },
          })
        );
        break;
      }

      case "join_room": {
        const { roomCode, name } = payload;
        const room = rooms[roomCode];

        if (room) {
          room.players.push({ id: ws.id, name, ws, score: 0 });

          // Broadcast updated room state
          room.players.forEach((p) => {
            p.ws.send(
              JSON.stringify({
                type: "room_joined",
                payload: {
                  roomCode,
                  players: room.players.map((pl) => ({
                    id: pl.id,
                    name: pl.name,
                    score: pl.score,
                  })),
                },
              })
            );
          });
        } else {
          ws.send(
            JSON.stringify({
              type: "error",
              payload: { message: "Room full or invalid." },
            })
          );
        }
        break;
      }

      case "start_game": {
        const { roomCode } = payload;
        const room = rooms[roomCode];
        console.log(room);
        rooms[roomCode].players.forEach((p) => (p.role = null));
        if (room && room.players.length >= 4 && ws.id === room.roomBoss) {
          shuffleAndAssignRoles(room);

          // Notify each player
          room.players.forEach((player) => {
            console.log({ room: roomCode, player: player });
            player.ws.send(
              JSON.stringify({
                type: "roles_assigned",
                payload: {
                  roomCode,
                  yourRole: player.role,
                  players: room.players.map((pl) => ({
                    id: pl.id,
                    name: pl.name,
                    score: pl.score,
                  })),
                },
              })
            );
          });
        }
        break;
      }

      case "game_move": {
        const { roomCode, guessedId, MantriId } = payload;
        const Chor = rooms[roomCode].players.find((p) => p.role === "Chor");
        const isCorrect = Chor.id === guessedId;
        const guessed = rooms[roomCode].players.find((p) => p.id === guessedId);
        const Mantri = rooms[roomCode].players.find((p) => p.id === MantriId);

        if (isCorrect) {
          // Mantri scores
          updatePlayerScore(roomCode, MantriId, 800);
        } else {
          // Chor scores
          updatePlayerScore(roomCode, Chor.id, 800);
        }

        const resultPayload = {
          type: "round_result",
          payload: {
            guessedName: guessed.name,
            Mantriname: Mantri.name,
            wasCorrect: isCorrect,
            roles: rooms[roomCode].players.map((p) => ({
              name: p.name,
              role: p.role,
              score: p.score,
            })),
          },
        };

        rooms[roomCode].players.forEach((p) =>
          p.ws.send(JSON.stringify(resultPayload))
        );
        break;
      }

      default: {
        console.log("Unknown message type:", type);
        break;
      }
    }
  });

  ws.on("close", (obj) => {
    console.log(
      `###A Connection has been closed , a player might have disconnected: \n ${inspect(
        ws.id,
        { showHidden: false, depth: 1, colors: true }
      )}`
    );

    Object.keys(rooms).forEach((code) => {
      const room = rooms[code];
      room.players = room.players.filter((p) => p.id !== ws.id);

      if (room.players.length === 0) {
        delete rooms[code];
      }
    });
  });
});
