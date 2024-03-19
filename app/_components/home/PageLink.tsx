import { ROUTES } from "@/_constants/common";
import styled from "styled-components";
import Link from "next/link";
import { useMemo } from "react";

interface IPageLinkProps {
  label: string;
  route: string;
  searchParams?: { isAdmin?: string };
}

const PageLink = (props: IPageLinkProps) => {
  const { label, route, searchParams } = props;
  const isAdmin = useMemo(() => searchParams?.isAdmin, [searchParams]);
  const redirectLink = useMemo(
    () =>
      isAdmin
        ? `${ROUTES[`ROUTE_${route}`]}?isAdmin=${isAdmin}`
        : ROUTES[`ROUTE_${route}`],
    [isAdmin, route]
  );
  return (
    <Redirect className="page-link" href={redirectLink}>
      {label}
    </Redirect>
  );
};

export default PageLink;

const Redirect = styled(Link)`
  font-weight: 600;
  width: fit-content;
  letter-spacing: 0.3px;
  &:hover {
    box-shadow: transparent 0px -1px 0px 0px,
      rgba(240, 240, 240, 0.3) 0px -1px 0px inset, rgb(63, 156, 53) 0px 2px 12px;
  }
`;
