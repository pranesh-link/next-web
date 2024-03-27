import { memo } from "react";
import { FlexBox } from "../common/Elements";
import { StarIcon, StarUnfilledIcon } from "../svg";

const SKILL_ICON_TEXT_MAP = {
  filled: {
    icon: <StarIcon />,
    text: "Star filled",
  },
  unfilled: {
    icon: <StarUnfilledIcon />,
    text: "Star unfilled",
  },
};

function SkillWithStars({ starNum }: { starNum: number }) {
  const { filled, unfilled } = SKILL_ICON_TEXT_MAP;
  return (
    <FlexBox className="stars">
      {Array(5)
        .fill(null)
        .map((_item, index) => {
          const skillParams = index + 1 <= starNum ? filled : unfilled;
          return (
            <div key={index} className="star">
              {skillParams.icon}
            </div>
          );
        })}
    </FlexBox>
  );
}

export default memo(SkillWithStars);
