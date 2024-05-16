import { getLocalStorage } from "@/_utils/profile/client";

const initialState = {
  pwaOffset: 0,
  showPwaBanner: false,
  isAppInstalled: getLocalStorage("isAppInstalled") || false,
};

export default function app(
  state = initialState,
  action: { type: string; payload: any }
) {
  console.log(action);
  const newState = Object.assign({}, state);
  switch (action.type) {
    case "SET_PWA_OFFSET":
      return {
        ...newState,
        pwaOffset: action.payload,
      };
    case "SET_SHOW_PWA_BANNER":
      return {
        ...newState,
        showPwaBanner: action.payload,
      };
    case "SET_IS_APP_INSTALLED":
      return {
        ...newState,
        isAppInstalled: action.payload,
      };
    default:
      return state;
  }
}
