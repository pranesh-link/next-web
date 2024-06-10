import { Schema, model, models } from "mongoose";

export interface IEmployee extends Document {
  name: string;
  age: string;
  salary: number;
}

const EmployeeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: String,
      required: true,
    },
    salary: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const EmployeeModel =
  models.Employee || model<IEmployee>("Employee", EmployeeSchema);

export default EmployeeModel;
