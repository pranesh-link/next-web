import MobileDetect from "mobile-detect";
import { GetServerSidePropsContext } from "next";
import { createContext } from "react";

export const getIsSsrMobile = (context: GetServerSidePropsContext) => {
  const md = new MobileDetect(context.req.headers["user-agent"] as string);

  return Boolean(md.mobile());
};

export const IsSsrMobileContext = createContext(false);
