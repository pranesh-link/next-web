import { AppContext } from "@/_store/app/context";
import {
  isInstanceOfPageLink,
  isInstanceOfPageLinkCollection,
} from "@/_utils/common";
import React, { useContext } from "react";
import { styled } from "styled-components";
import { FlexBox, FlexBoxSection } from "../common/Elements";
import PageLink from "./PageLink";

function HomePage({ searchParams }: { searchParams?: { isAdmin?: string } }) {
  const {
    data: {
      currentDevice: { isMobile },
      appConfig = { homepage: { title: "", pages: [] } },
      hasError,
    },
  } = useContext(AppContext);
  if (hasError) {
    throw new Error("Failed to fetch data");
  }

  const {
    homepage: { title, pages },
  } = appConfig;
  return (
    <HomePageWrapper $direction="column">
      <FlexBoxSection $direction="column">
        <h1 className="homepage-title">{title}</h1>
        {pages.map((item) => {
          let displayNode: JSX.Element = <></>;
          const { id, label } = item;
          if (isInstanceOfPageLink(item)) {
            displayNode = (
              <PageLink
                key={id}
                label={label}
                route={item.route}
                searchParams={searchParams}
              />
            );
          } else if (isInstanceOfPageLinkCollection(item)) {
            displayNode = (
              <React.Fragment key={id}>
                <h2 className="tools">{label}</h2>
                <FlexBox>
                  {item.links.map((item) => {
                    const { id, label } = item;
                    return (
                      <PageLink
                        key={id}
                        label={label}
                        route={item.route}
                        searchParams={searchParams}
                      />
                    );
                  })}
                </FlexBox>
              </React.Fragment>
            );
          }
          return displayNode;
        })}
      </FlexBoxSection>
    </HomePageWrapper>
  );
}

export default HomePage;

const HomePageWrapper = styled(FlexBoxSection)`
  height: 100vh;
  background: #faf9f6;
  padding: 50px;
  .shimmer {
    height: 100%;
    width: 100%;
    border-radius: 15px;
    background: linear-gradient(-45deg, #ccc 40%, #faf9f6 50%, #eee 60%);
    background-size: 300%;
    background-position-x: 100%;
    animation: shimmer 2s infinite linear;
  }

  h1 {
    text-align: center;
  }

  .homepage-title {
    flex-basis: 40%;
    color: #3498db;
    font-size: 24px;
  }
  .homepage-construction {
    color: #ffa500;
  }
  .tools {
    color: #3f9c35;
    font-size: 18px;
    margin-left: 10px;
  }
  .page-link {
    border: none;
    background-color: transparent;
    cursor: pointer;
    outline: none;
    padding: 10px 15px;
    border-radius: 20px;
    background: #3498db;
    color: #f0f0f0;
    margin-bottom: 15px;
    margin-right: 20px;
    font-weight: 600;
    width: fit-content;
    letter-spacing: 0.3px;
    text-decoration: none;
    &:hover {
      background: #3f9c35;
      box-shadow: transparent 0px -1px 0px 0px,
        rgba(240, 240, 240, 0.3) 0px -1px 0px inset,
        rgb(63, 156, 53) 0px 2px 12px;
    }
  }
  @media only screen and (max-width: 767px) {
    padding: 25px;
  }
`;
