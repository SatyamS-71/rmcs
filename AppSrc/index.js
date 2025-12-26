// const WebSocket = require("ws");
import { WebSocketServer } from "ws";
// const { v4: uuidv4 } = require("uuid"); // For generating unique IDs
import { v4 as uuidv4 } from "uuid";

const PORT = process.env.PORT || 8010;

const wss = new WebSocketServer({
  port: PORT,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024,
  },
},(obj)=>{console.log(obj)});

const rooms = {};
// Structure: { roomCode: { players: [{ id, name, ws, score, role }], roomBoss } }

wss.on("connection", (ws) => {
  ws.id = uuidv4();
  console.log(`New connection event occurred, a player might have connected: ${JSON.stringify(ws)}`);
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
    function shuffleAndAssignRoles(room) {
      const roles = ["Raja", "Mantri", "Chor", "Sipahi"];

      for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
      }

      room.players.forEach((player, idx) => {
        player.role = roles[idx];
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

        if (room && room.players.length < 4) {
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

        if (room && ws.id === room.roomBoss) {
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
            guessedId,
            MantriId,
            wasCorrect: isCorrect,
            roles: rooms[roomCode].players.map((p) => ({
              id: p.id,
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

  ws.on("close", () => {
    Object.keys(rooms).forEach((code) => {
      const room = rooms[code];
      room.players = room.players.filter((p) => p.id !== ws.id);

      if (room.players.length === 0) {
        delete rooms[code];
      }
    });
  })
});

