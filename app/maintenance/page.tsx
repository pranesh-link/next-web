"use client";
import styled from "styled-components";
import { IMaintenance } from "@/_store/common/types";
import { useContext, useEffect, useRef } from "react";
import { getIconUrl } from "@/_utils/profile/server";
import { ILinkInfo, ISectionInfo } from "@/_store/profile/types";
import Contact from "@/_components/profile/sections/Contact";
import { CMS_SERVER_CONFIG, ENVIRONMENT, ROUTES } from "@/_constants/common";
import { AppContext } from "@/_store/app/context";
import { redirect } from "next/navigation";
import Image from "next/image";
import MaintenanceAnimation from "@/_assets/maintenance.gif";

interface IMaintenanceProps {
  maintenance: IMaintenance;
  links: ILinkInfo;
  isMobile: boolean;
}
const MaintenancePage = (props: IMaintenanceProps) => {
  const {
    data: {
      links,
      currentDevice: { isMobile },
      maintenance,
      maintenance: { isUnderMaintenance },
    },
  } = useContext(AppContext);

  useEffect(() => {
    if (!isUnderMaintenance) {
      //   redirect(ROUTES.ROUTE_PROFILE);
    }
  }, [isUnderMaintenance]);
  return (
    <MaintenanceArticle $isMobile={isMobile}>
      <div className="maintenance-info">
        <Image
          className="maintenance-image"
          height={isMobile ? 300 : 400}
          alt="maintenance"
          src={MaintenanceAnimation}
        />
        <h1 dangerouslySetInnerHTML={{ __html: maintenance.message }} />
      </div>
      <div className="contact-links">
        <Contact links={links} refObj={useRef(null)} />
      </div>
    </MaintenanceArticle>
  );
};

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

export default MaintenancePage;
