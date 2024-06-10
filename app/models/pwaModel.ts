import { IPWA } from "@/_store/profile/types";
import { Schema, model, models } from "mongoose";

export interface IPWAModel extends Document, IPWA {}

const PWASchema: Schema = new Schema(
  {
    messages: {
      install: String,
      yes: String,
      no: String,
      open: String,
      relatedApp: String,
      installApp: String,
      openApp: String,
    },
    bannerExpiryTime: Number,
  },
  { timestamps: true }
);

const PWAModel = models.PWA || model<IPWAModel>("PWA", PWASchema);

export default PWAModel;
