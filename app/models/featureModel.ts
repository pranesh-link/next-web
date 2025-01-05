import { Schema, model, models } from "mongoose";

export interface IFeatureModel extends Document {
  pwa: boolean;
  downloadResume: boolean;
  contactMe: boolean;
}

const FeatureSchema: Schema = new Schema({
  pwa: Boolean,
  downloadResume: Boolean,
  contactMe: Boolean,
});

const FeatureModel =
  models.Feature || model<IFeatureModel>("Feature", FeatureSchema);

export default FeatureModel;
