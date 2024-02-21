
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

function AskPasswordInput(props) {
  return (
    <>
      <div className="add-item-popup" style={{display: props.show}}>
        <h1 className="add-item-popup-title">Type in the password</h1>
        <div className="add-item-popup-body">
          <div className="add-item-popup-upper-body">
            <input type="password" className="add-item-popup-input" value={props.password} onChange={(e) => props.setPassword(e.target.value)} placeholder="Password" />
          </div>
          <br/>
          <div className="add-item-popup-footer">
            <div></div>
            <div className="add-item-popup-button-container">
              <button className="add-item-popup-button add-item-popup-button-cancel" onClick={() => props.setShow("none")}>Cancel</button>
              <button className="add-item-popup-button add-item-popup-button-confirm" onClick={props.handlePasswordInput}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default AskPasswordInput;
