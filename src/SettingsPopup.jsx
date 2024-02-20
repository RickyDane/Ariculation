import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { confirm } from "@tauri-apps/api/dialog";

function SettingsPopup(props) {
  const [lists, setLists] = useState(props.listTypes);
  const [users, setUsers] = useState(props.users);
  const [selectedList, setSelectedList] = useState(0);

  const loadState = async () => {
    props.setIsPending(true);
    await invoke("get_list_types").then(listTypes => { props.setListTypes(listTypes); setLists(listTypes); setSelectedList(listTypes[0].id); });
    await invoke("get_users").then(users => setUsers(users));
    props.setIsPending(false);
  }

  useEffect(() => {
    loadState();
  }, [props.show]);

  const handleChangeListType = async (e) => {
    setSelectedList(e.target.value);
  }



  return (
    <>
      <div className="add-item-popup" style={{display: props.show}}>
        <div className="add-item-popup-body">
          <h1 className="add-item-popup-title">Settings</h1>
          <hr/>
          <br/>
          <div className="add-item-popup-upper-body">
            <div>
              <p style={{color: "white"}}>User lists</p>
              <br/>
              <div className="list-type-container">
                <select className="list-type-select item-select" onChange={(e) => handleChangeListType(e)}>
                  {lists.map((listType) => (
                    <option key={listType.id} value={listType.id}>{listType.name} - {users.find(user => user.id == listType.user_id)?.name}</option>
                  ))}
                </select>
                <button className="add-list-button add-item-popup-button-cancel" style={{height: "35px", color: "red"}} onClick={async () => {
                  let isDeleteList = await confirm(
                    "Delete: "
                    + lists.find(list => list.id == selectedList).name
                    + (
                        users.find(user => user.id == lists.find(list => list.id == selectedList)?.user_id)?.name != null
                        ? " - " + users.find(user => user.id == lists.find(list => list.id == selectedList)?.user_id).name
                        : ""
                      )
                    + "?"
                  );
                  if (isDeleteList == true) {
                    props.setIsPending(true);
                    await invoke("delete_list_type", {id: parseInt(selectedList)});
                    await invoke("get_list_types").then(listTypes => { props.setListTypes(listTypes); setLists(listTypes); setSelectedList(listTypes[0].id); props.setCurrentListType(listTypes[0].id) });
                    props.setIsPending(false);
                  }
                }}>
                <i className="fa-solid fa-trash"></i></button>
              </div>
            </div>
            <div>
              <p style={{color: "white"}}>Database Url</p>
              <br/>
              <div style={{display: "flex", flexFlow: "column", gap: "10px", width: "100%"}}>
                <input type="text" className="add-item-popup-input" placeholder="dbuser:password@localhost:3306" value={props.appConfig.db_url} onChange={(e) => props.setAppConfig({...props.appConfig, db_url: e.target.value})} />
                <button className="add-item-popup-button add-item-popup-button-confirm" style={{color: "white", borderRadius: "5px"}} onClick={async () => {
                  props.setIsPending(true);
                  await invoke("update_app_config", { dbUrl: props.appConfig.db_url });
                  props.runClear();
                  props.setIsPending(false);
                }}>Save</button>
              </div>
            </div>
          </div>
          <div className="add-item-popup-footer">
            <div></div>
            <div className="add-item-popup-button-container">
              <button className="add-item-popup-button add-item-popup-button-confirm" style={{color: "white"}} onClick={() => props.setShow("none")}>Close</button>
              {/* <button className="add-item-popup-button add-item-popup-button-cancel" style={{color: "red"}} onClick={() => { props.confirmFunction(); props.setShow("none"); }}><i className="fa-solid fa-trash-can"></i></button> */}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default SettingsPopup;
