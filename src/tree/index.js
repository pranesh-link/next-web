import React from 'react';
import './index.css'

export default function Tree() {
    return (
      <div className="tree">
        mammals<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cheetah <br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;bear <br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;lion <br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;dog <br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;elephant <br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ape <br/>
      </div>
    )
}
