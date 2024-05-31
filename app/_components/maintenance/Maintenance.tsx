import { AppContext } from "@/_store/app/context";
import { useContext } from "react";
import { styled } from "styled-components";

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
        <video
          controls={false}
          autoPlay
          loop
          muted
          height={isMobile ? 300 : 400}
          width={"100%"}
        >
          <source src={"/maintenance.mp4"} type="video/mp4" />
          Your browser does not support the video tag
        </video>
        <h1 dangerouslySetInnerHTML={{ __html: maintenance.message }} />
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
    margin-top: 5px;
    font-weight: 100;
    text-align: center;
  }

  @media only screen and (max-width: 767px) {
    .maintenance-info {
      padding: 20px 0px;
    }
  }
`;
