import { FlexBoxSection } from "@/_components/common/Elements";
import { SECTION_ORDER_DISPLAY } from "@/_constants/profile";
import { useAppSelector } from "@/_redux/hooks";
import { ProfileContext } from "@/_store/profile/page/context";
import { ProfileSectionType, RefTypes } from "@/_store/profile/types";
import { scrollTo } from "@/_utils/common/ScrollTo";
import { uppercase } from "@/_utils/profile/server";
import classNames from "classnames";
import React, { useEffect, useMemo } from "react";
import { MenuBtn, MenuWrapper } from "./Elements";

interface IMenuBarProps {
  isMobileMenu?: boolean;
  closeHamburgerMenu?: () => void;
  onMenuChange?: (section: string) => void;
}
const MenuBar = (props: IMenuBarProps) => {
  const { refs, data, currentSection, isMobile } =
    React.useContext(ProfileContext);
  const pwaOffsetState = useAppSelector((state) => state.app.pwaOffset);
  const { onMenuChange } = props;
  const initialOffset = useMemo(() => (isMobile ? 80 : 30), [isMobile]);
  const goTo = (section: string) => {
    scrollTo(`#${section}`, initialOffset + pwaOffsetState);
  };
  let timeout: any;
  const menuItems = Object.keys(data.sections)
    .reduce(
      (
        items: { title: string; ref: string; section: string; order: number }[],
        current: string
      ) => {
        if (data.sections[current as ProfileSectionType].ref) {
          const { title, ref = "" } =
            data.sections[current as ProfileSectionType];

          const { order, display } = SECTION_ORDER_DISPLAY[uppercase(current)];
          if (display !== false) {
            items.push({
              section: current,
              title,
              ref,
              order,
            });
          }
        }
        return items;
      },
      []
    )
    .sort((a, b) => a.order - b.order);

  const handleScroll = () => {
    const resultPosition = menuItems.reduce(
      (result, curr, index) => {
        const { ref, section } = curr;
        const currentRef = refs[ref as RefTypes];
        if (currentRef.current) {
          const pos = Math.round(
            currentRef.current.getBoundingClientRect().top -
              initialOffset -
              pwaOffsetState
          );

          if (index === 0 || (pos <= 0 && pos > result.pos)) {
            return {
              section,
              pos,
            };
          }
        }
        return result;
      },
      { section: "aboutMe", pos: 0 }
    );
    if (onMenuChange) {
      onMenuChange(resultPosition.section);
    }
  };

  const debounce = (method: () => void, delay: number) => {
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      method();
    }, delay);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", () => {
      debounce(handleScroll, 100);
    });
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOffset]);
  return (
    <MenuWrapper
      className={classNames("wrapper", { mobile: props.isMobileMenu })}
    >
      <FlexBoxSection $direction="column">
        {menuItems.map((item) => (
          <MenuBtn
            key={item.section}
            onClick={() => {
              goTo(item.section);
              if (props.closeHamburgerMenu) {
                props.closeHamburgerMenu();
              }
            }}
            className={classNames({
              "is-active": currentSection === item.section,
            })}
          >
            {item.title}
          </MenuBtn>
        ))}
      </FlexBoxSection>
    </MenuWrapper>
  );
};

export default MenuBar;
