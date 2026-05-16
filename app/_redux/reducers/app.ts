const initialState = {};

export default function app(
  state = initialState,
  action: { type: string; payload: any }
) {
  switch (action.type) {
    default:
      return state;
  }
}
