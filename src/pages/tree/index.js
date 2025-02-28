import React from "react";
import Input from "../../components/Input";
import data from "./data.json";
import "./index.css";

export default function Tree() {
  const [animalTree, setAnimalTree] = React.useState(data);

  const addAnimal = (parent, name, isMain) => {
    const newAnimal = {
      name,
      children: [],
      spacingClassName: parent.spacingClassName + " ",
    };

    if (isMain) {
      newAnimal.spacingClassName =
        animalTree.children[animalTree.children.length - 1].spacingClassName;
      setAnimalTree({
        ...animalTree,
        children: [...animalTree.children, newAnimal],
      });
    } else {
      parent.children.push(newAnimal);
      const updatedChildren = animalTree.children.reduce((acc, child) => {
        child.name === parent.name ? acc.push(parent) : acc.push(child);
        return acc;
      }, []);
      setAnimalTree({ ...animalTree, children: updatedChildren });
    }
  };

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
        <div>
          <span>{animalTree.name}</span>

          <Input
            placeholder={`Add child to ${animalTree.name}`}
            addAnimal={addAnimal}
            isPrimaryChild
            parent={animalTree}
          />
        </div>
        {animalTree.children.map((child, index) => {
          return (
            <div key={index} className={`${child.spacingClassName} margin-5`}>
              <span>{child.name}</span>
              <Input
                placeholder={`Add child to ${child.name}`}
                addAnimal={addAnimal}
                parent={child}
              />
              {child.children && child.children.length > 0 && (
                <div className="spacing-1">
                  {child.children.map((item) => item.name).join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
