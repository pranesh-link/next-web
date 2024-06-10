import { Schema, model, models } from "mongoose";

export interface IFeatureModel extends Document {
  pwa: boolean;
}

const FeatureSchema: Schema = new Schema({
  pwa: Boolean,
});

const FeatureModel =
  models.Feature || model<IFeatureModel>("Feature", FeatureSchema);

export default FeatureModel;
