import React from "react";
import "./index.css";

export default function Tree() {
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
        <div>mammals</div>
        <div className="first-spacing">cheetah</div>
        <div className="first-spacing">bear</div>
        <div className="second-spacing">lion</div>
        <div className="second-spacing">dog</div>
        <div className="third-spacing">elephant</div>
        <div className="first-spacing">ape</div>
      </div>
    </>
  );
}
