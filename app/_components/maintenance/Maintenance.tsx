import MaintenanceAnimation from "@/_assets/maintenance.gif";
import { AppContext } from "@/_store/app/context";
import { useContext, useRef } from "react";
import { styled } from "styled-components";
import LazyLoadedImage from "../common/LazyLoadedImage";
import Contact from "../profile/sections/Contact";

function Maintenance() {
  const {
    data: {
      links,
      currentDevice: { isMobile },
      maintenance,
    },
  } = useContext(AppContext);

  return (
    <MaintenanceArticle $isMobile={isMobile}>
      <div className="maintenance-info">
        <LazyLoadedImage
          className="maintenance-image"
          height={isMobile ? 300 : 400}
          alt="maintenance"
          src={MaintenanceAnimation}
          unoptimized
        />
        <h1 dangerouslySetInnerHTML={{ __html: maintenance.message }} />
      </div>
      <div className="contact-links">
        <Contact links={links} refObj={useRef(null)} />
      </div>
    </MaintenanceArticle>
  );
}

export default Maintenance;

const MaintenanceArticle = styled.article<{ $isMobile: boolean }>`
  display: block;
  height: 100vh;
  overflow: hidden;
  padding: 0;
  background: #d6433b;
  color: #fff;

  .maintenance-image {
    height: ${(props) => (props.$isMobile ? "300px" : "400px")};
  }

  .contact-links {
    position: fixed;
    margin: 0 auto;
    width: 100%;
    bottom: 0px;
    padding: 20px 0;
    background: rgb(34, 34, 34);
    .links {
      justify-content: space-evenly;
    }
    img {
      height: 30px;
      margin-right: ${(props) => (props.$isMobile ? "0" : "50px")};
    }
  }

  .maintenance-info {
    margin: 0 auto;
    padding: 50px;
    text-align: center;
  }

  p {
    font-size: 20px;
  }

  h1 {
    font-size: ${(props) => (props.$isMobile ? "30px" : "50px")};
    font-weight: 100;
    text-align: center;
  }
`;
