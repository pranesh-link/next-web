import { Schema, model, models } from "mongoose";

export interface IMaintenanceModel extends Document {
  isUnderMaintenance: boolean;
  image: string;
  message: string;
}

const MaintenanceSchema: Schema = new Schema(
  {
    isUnderMaintenance: Boolean,
    image: String,
    message: String,
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        return ret;
      },
    },
    timestamps: true,
  }
);

const MaintenanceModel =
  models.Maintenance ||
  model<IMaintenanceModel>("Maintenance", MaintenanceSchema);

export default MaintenanceModel;
