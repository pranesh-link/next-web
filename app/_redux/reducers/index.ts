import { combineReducers } from "redux";
import appReducer from "./app";

const rootReducer = combineReducers<any>({
  app: appReducer,
});

export default rootReducer;
