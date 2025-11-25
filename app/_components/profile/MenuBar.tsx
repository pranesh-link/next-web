import BackArrow from "@/_assets/back-arrow.gif";
import { SECTION_ORDER_DISPLAY } from "@/_constants/profile";
import { useAppSelector } from "@/_redux/hooks";
import { ProfileContext } from "@/_store/profile/page/context";
import { ProfileSectionType, RefTypes } from "@/_store/profile/types";
import { scrollTo } from "@/_utils/common/ScrollTo";
import { uppercase } from "@/_utils/profile/server";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import LazyLoadedImage from "../common/LazyLoadedImage";
import { MenuBtn, MenuButton, MenuWrapper } from "./Elements";

interface IMenuBarProps {
  isMobileMenu?: boolean;
  closeHamburgerMenu?: () => void;
  onMenuChange?: (section: string) => void;
}
const MenuBar = (props: IMenuBarProps) => {
  const { refs, data, currentSection, isMobile } =
    React.useContext(ProfileContext);
  const router = useRouter();
  const pwaOffsetState = useAppSelector((state) => state.app.pwaOffset);
  const { onMenuChange } = props;
  const initialOffset = useMemo(() => (isMobile ? 80 : 20), [isMobile]);
  const [isScrolled, setIsScrolled] = useState(false);
  
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
    // Update scroll state for transparency effect
    const scrollPosition = window.scrollY;
    setIsScrolled(scrollPosition > 50);
    
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

  const goToHome = () => router.push("/");

  return (
    <MenuWrapper
      className={classNames("wrapper", { 
        mobile: props.isMobileMenu,
        scrolled: isScrolled && !props.isMobileMenu
      })}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        {!props.isMobileMenu && (
          <MenuButton onClick={goToHome} className="home">
            <LazyLoadedImage
              src={BackArrow}
              className="back-arrow"
              height={20}
              width={20}
              alt="back-arrow"
              unoptimized
            />
            <span>Home</span>
          </MenuButton>
        )}
        {menuItems.map((item) => (
          <div key={item.section}>
            {props.isMobileMenu ? (
              <MenuBtn
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
            ) : (
              <MenuButton
                className={classNames({
                  "is-active": currentSection === item.section,
                })}
                onClick={() => {
                  goTo(item.section);
                  if (props.closeHamburgerMenu) {
                    props.closeHamburgerMenu();
                  }
                }}
              >
                {item.title}
              </MenuButton>
            )}
          </div>
        ))}
      </div>
    </MenuWrapper>
  );
};

export default MenuBar;
