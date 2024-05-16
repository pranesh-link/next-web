import BackArrow from "@/_assets/back-arrow.gif";
import classNames from "classnames";
import Link from "next/link";
import { useMemo } from "react";
import styled from "styled-components";
import LazyLoadedImage from "./LazyLoadedImage";

interface IRedirectLinkProps {
  route: string;
  label: string;
  offset: number;
}
const RedirectLink = (props: IRedirectLinkProps) => {
  const isHomeRoute = useMemo(() => props.route === "/", [props.route]);
  const { route, label, offset } = props;
  return (
    <RedirectButton
      $offset={offset}
      className={classNames({ "home-link": isHomeRoute })}
      href={route}
    >
      {isHomeRoute && (
        <LazyLoadedImage
          src={BackArrow}
          className="back-arrow"
          height={30}
          width={30}
          alt="back-arrow"
        />
      )}
      <span>{label}</span>
    </RedirectButton>
  );
};

export default RedirectLink;

const RedirectButton = styled(Link)<{ $offset: number }>`
  text-decoration: none;
  padding: 10px 20px;
  background: #3f9c35;
  color: #fff;
  letter-spacing: 0.3px;
  font-weight: 600;
  border-radius: 5px;
  transition: all 1s ease-out;
  &:not(.home-link):hover {
    background: #027148;
  }
  &.home-link {
    position: fixed;
    top: ${(props) => (props.$offset || 0) + 30}px;
    left: 30px;
    display: flex;
    align-items: center;
    z-index: 100;
    padding: 5px 10px;
    border: 1px solid #3f9c35;
    background: #fff;
    color: #3f9c35;
    &:hover {
      box-shadow: transparent 0px -1px 0px 0px,
        rgba(240, 240, 240, 0.3) 0px -1px 0px inset,
        rgb(63, 156, 53) 0px 2px 12px;
    }
  }
  .back-arrow {
    margin-right: 5px;
  }

  @media only screen and (max-width: 767px) {
    &.home-link {
      top: ${(props) => (props.$offset || 0) + 20}px;
      left: 20px;
    }
  }
`;
