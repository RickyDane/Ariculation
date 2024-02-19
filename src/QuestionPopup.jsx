
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

function QuestionPopup(props) {

  return (
    <>
      <div className="add-item-popup" style={{display: props.show}}>
        <h1 className="add-item-popup-title">{props.msg}</h1>
        <div className="add-item-popup-body">
          <div className="add-item-popup-upper-body">
            <p style={{color: "white"}}>
              {props.item.id > 0 ?
                "Id: " + props.item.id
                : ""
              }
            </p>
            <p style={{color: "white"}}>
              {props.item.id > 0 ?
                "Name: " + props.item.name
                : ""
              }
            </p>
          </div>
          <div className="add-item-popup-footer">
            <div></div>
            <div className="add-item-popup-button-container">
              <button className="add-item-popup-button add-item-popup-button-confirm" style={{color: "white"}} onClick={() => props.setShow("none")}>Cancel</button>
              <button className="add-item-popup-button add-item-popup-button-cancel" style={{color: "red"}} onClick={() => { props.confirmFunction(); props.setShow("none"); }}><i className="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default QuestionPopup;
