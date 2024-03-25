import styled from "styled-components";

export default function ProgressBar() {
  return (
    <Container>
      <div className="progress-bar">
        <div className="progress-bar-value" />
      </div>
    </Container>
  );
}

const Container = styled.div`
  width: 300px;
  margin-top: 10px;

  .progress-bar {
    height: 4px;
    background-color: rgba(5, 114, 206, 0.2);
    width: 100%;
    overflow: hidden;
  }

  .progress-bar-value {
    width: 100%;
    height: 100%;
    background-color: #0572ce;
    animation: indeterminateAnimation 1s infinite linear;
    transform-origin: 0% 50%;
  }

  @keyframes indeterminateAnimation {
    0% {
      transform: translateX(0) scaleX(0);
    }
    40% {
      transform: translateX(0) scaleX(0.4);
    }
    100% {
      transform: translateX(100%) scaleX(0.5);
    }
  }
`;
