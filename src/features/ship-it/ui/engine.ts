import { createEngine } from "../engine";
import { SHIP_IT_CONTENT } from "../content";

/** The single engine instance the UI plays against. */
export const shipIt = createEngine(SHIP_IT_CONTENT);
