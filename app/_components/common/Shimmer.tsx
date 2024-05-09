"use client";
import styled from "styled-components";

const Shimmer = () => {
  return (
    <ShimmerWrap>
      <ShimmerOverlay />
    </ShimmerWrap>
  );
};

export default Shimmer;

const ShimmerWrap = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;
  padding: 25px;
  z-index: 200;
  background: #f0f0f0;
`;
const ShimmerOverlay = styled.div`
  height: 100%;
  width: 100%;
  border-radius: 15px;
  background: linear-gradient(-45deg, #ccc 40%, #faf9f6 50%, #eee 60%);
  box-shadow: transparent 0px -1px 0px 0px,
    rgba(240, 240, 240, 0.3) 0px -1px 0px inset, #ccc 0px 2px 12px;
  background-size: 300%;
  background-position-x: 100%;
  animation: shimmer 5s infinite linear;
  @keyframes shimmer {
    to {
      background-position-x: 0%;
    }
  }
`;
