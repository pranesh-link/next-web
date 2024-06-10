import { IConfigData } from "@/_store/common/types";
import { Schema, Types, model, models } from "mongoose";

export interface IConfig extends Document, IConfigData {}

const ConfigDataParamsSchema: Schema = new Schema({
  type: String,
  ref: String,
  name: String,
});

const PageLinkSchema: Schema = new Schema({
  id: String,
  label: String,
  route: String,
});

const NotFoundPageConfigSchema: Schema = new Schema({
  title: String,
});

const HomepageConfigSchema: Schema = new Schema({
  title: String,
  profileRedirectDelay: Number,
  pages: [
    { id: String, label: String, route: String, links: [PageLinkSchema] },
  ],
});

const PWAConfigSchema: Schema = new Schema({
  browsers: [String],
  os: [String],
});

const PreloadSrcSchema: Schema = new Schema({
  id: String,
  type: String,
  fileName: String,
  fileLocation: String,
});

const ConfigSchema: Schema = new Schema(
  {
    jsonConfig: {
      defaultConfig: [ConfigDataParamsSchema],
      profileConfig: [ConfigDataParamsSchema],
    },
    appConfig: {
      homepage: HomepageConfigSchema,
      notFoundPage: NotFoundPageConfigSchema,
      labels: Types.ObjectId,
      pwa: PWAConfigSchema,
      preloadSrcList: PreloadSrcSchema,
    },
  },
  { timestamps: true }
);

const ConfigModel = models.Config || model<IConfig>("Config", ConfigSchema);

export default ConfigModel;
