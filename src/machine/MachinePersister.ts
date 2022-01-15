import { GameStates } from "./states";
import { GameContext } from "../types";
import { readFileSync, writeFile, writeFileSync } from "fs";

const filePath = "./state.json";

export class MachinePersister {
  static async persist(machine: { state: GameStates; context: GameContext }) {
    writeFile(
      filePath,
      JSON.stringify(
        {
          state: machine.state,
          context: machine.context,
        },
        null,
        2
      ),
      () => null
    );
  }

  static retrieve(): { state?: GameStates; context: Partial<GameContext> } {
    try {
      return JSON.parse(readFileSync(filePath).toLocaleString());
    } catch (e) {
      return {
        state: undefined,
        context: {},
      };
    }
  }
}
