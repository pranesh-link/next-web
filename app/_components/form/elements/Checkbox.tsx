import { ActionBtn, FlexBox } from "@/_components/common/Elements";
import styled from "styled-components";

/** Custom-styled checkbox input with hover and checked-state visuals. */
export const CheckboxInput = styled.input`
  margin: 0;
  margin-right: 10px;
  height: 20px;
  width: 20px;
  cursor: pointer;
  -webkit-appearance: none;
  background: #fff;
  border-radius: 3px;
  border: 0.5px solid #ccc;
  &:checked {
    background-color: #3f9c35;
    border: none;
    box-shadow: transparent 0 -1px 0px 1px, inset transparent 0 -1px 0px,
      #3f9c35 0 2px 20px;
    color: #99a1a7;
  }
  &:not(:checked):hover {
    border: none;
    box-shadow: transparent 0 -1px 0px 1px, inset transparent 0 -1px 0px,
      #3498db 0 2px 20px;
  }
`;

/** Label text rendered next to a `CheckboxInput`. */
export const CheckboxInputLabel = styled.label`
  font-size: 13px;
  letter-spacing: 0.5px;
  &.checked {
    font-weight: 600;
  }
`;

/** Absolute-positioned tick mark rendered over a checked checkbox. */
export const CheckboxTick = styled(ActionBtn)`
  padding: 0;
  position: absolute;
  left: 4px;
  top: 0px;
  height: 13px;
`;

/** Positioning wrapper for a checkbox + tick + label trio. */
export const CheckboxInputWrap = styled(FlexBox)`
  width: 100%;
  position: relative;
`;
