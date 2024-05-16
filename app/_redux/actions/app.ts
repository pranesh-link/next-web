export const updatePwaOffset = (offset: number) => ({
  type: "SET_PWA_OFFSET",
  payload: offset,
});

export const updateShowPwaBanner = (show: boolean) => ({
  type: "SET_SHOW_PWA_BANNER",
  payload: show,
});

export const updateIsAppInstalled = (isInstalled: boolean) => ({
  type: "SET_IS_APP_INSTALLED",
  payload: isInstalled,
});
