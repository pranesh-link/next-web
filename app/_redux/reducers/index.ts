import { combineReducers } from "redux";
import appReducer from "./app";

const rootReducer = combineReducers({
  app: appReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
