import React from "react";
import data from "./data.json";
import "./index.css";

export default function Tree() {
  const [animalTree, setAnimalTree] = React.useState(data);

  return (
    <>
      <div className="tree">
        mammals
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cheetah <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;bear <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;lion <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;dog <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;elephant{" "}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ape <br />
      </div>
      <div className="tree">
        <div>{animalTree.name}</div>
        {animalTree.children.map((child, index) => {
          return (
            <div key={index} className={child.spacingClassName}>
              {child.name}
            </div>
          );
        })}
      </div>
    </>
  );
}
