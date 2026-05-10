import React from "react";
import { render, screen } from "@testing-library/react";
import BMIGauge from "../BMIGauge";
import { BMI_BANDS } from "@/couple/lifestyle/wellness/_constants";

describe("BMIGauge", () => {
  it("should render needle and value for an underweight BMI", () => {
    render(<BMIGauge bmi={16} bands={BMI_BANDS} />);
    expect(screen.getByTestId("bmi-gauge-needle")).toBeInTheDocument();
    expect(screen.getByText("16.0")).toBeInTheDocument();
  });

  it("should render needle and value for a normal BMI", () => {
    render(<BMIGauge bmi={22} bands={BMI_BANDS} />);
    expect(screen.getByTestId("bmi-gauge-needle")).toBeInTheDocument();
    expect(screen.getByText("22.0")).toBeInTheDocument();
  });

  it("should render needle and value for an overweight BMI", () => {
    render(<BMIGauge bmi={27} bands={BMI_BANDS} />);
    expect(screen.getByTestId("bmi-gauge-needle")).toBeInTheDocument();
    expect(screen.getByText("27.0")).toBeInTheDocument();
  });

  it("should render needle and value for an obese BMI", () => {
    render(<BMIGauge bmi={33} bands={BMI_BANDS} />);
    expect(screen.getByTestId("bmi-gauge-needle")).toBeInTheDocument();
    expect(screen.getByText("33.0")).toBeInTheDocument();
  });

  it("should render without crashing when bmi is 0", () => {
    render(<BMIGauge bmi={0} bands={BMI_BANDS} />);
    expect(screen.getByTestId("bmi-gauge-needle")).toBeInTheDocument();
    expect(screen.getByText("0.0")).toBeInTheDocument();
  });
});
