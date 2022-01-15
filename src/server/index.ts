import Fastify from "fastify";
import FastifyWS, { SocketStream } from "fastify-websocket";
import FastifyStatic from "fastify-static";
import path from "path";
import { interpret } from "xstate";
import { GameMachine } from "../machine";
import { GameModel } from "../machine/model";
import { v4 as uuid } from "uuid";
import Randanimal from "randanimal";
import { publishContext } from "../func/socket";
import { GameStates } from "../machine/states";
import { GameEvent } from "../types";
import { MachinePersister } from "../machine/MachinePersister";

const connections = new Map<string, SocketStream>();

const previousMachineState = MachinePersister.retrieve();
const gameService = interpret(GameMachine)
  .onTransition((state) => {
    console.log("State change");
    console.log("====");
    console.log(state.value, state.context);
    publishContext(state.value as GameStates, state.context, connections);
    MachinePersister.persist({
      state: state.value as GameStates,
      context: state.context,
    });
  })
  .start(previousMachineState.state);

gameService.state.context = {
  ...gameService.state.context,
  ...previousMachineState.context,
};

const fastify = Fastify({ logger: true });
fastify.register(FastifyWS);
fastify.register(FastifyStatic, {
  root: path.resolve("./public"),
});

// Declare a route
fastify.get("/ws", { websocket: true }, (connection, req) => {
  const query = req.query as Record<string, string>;
  const userId = query.userId ?? uuid();
  connections.set(userId, connection);
  gameService.send(GameModel.events.join(userId, Randanimal.randanimalSync()));
  connection.socket.send(
    JSON.stringify({
      type: "auth",
      userId: userId,
    })
  );
  connection.socket.on("message", (rawMessage) => {
    const message = JSON.parse(rawMessage.toLocaleString()) as GameEvent;
    gameService.send({ ...message, playerId: userId });
  });
  connection.socket.on("close", (message) => {
    connections.delete(userId);
    gameService.send(GameModel.events.leave(userId));
  });
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(8000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
