import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { confirm } from "@tauri-apps/api/dialog";

function SettingsPopup(props) {
	const [lists, setLists] = useState(props.listTypes);
	const [users, setUsers] = useState(props.users);
	const [selectedList, setSelectedList] = useState(0);

	const loadState = async () => {
		props.setIsPending(true);
		if (
			props.appConfig.db_url == "dbuser:dbpassword@dbserver:dbport" ||
			props.appConfig.db_url == ""
		) {
			alert("Database not yet configured correctly!");
			return;
		}
		await invoke("get_list_types")
			.then((listTypes) => {
				props.setListTypes(listTypes);
				setLists(listTypes);
				setSelectedList(listTypes[0]?.id);
			})
			.catch((error) => {
				alert(error + " Please check you database credentials");
			});
		await invoke("get_users")
			.then((users) => setUsers(users))
			.catch((error) => {
				alert(error + " Please check you database credentials");
			});
		props.setIsPending(false);
	};

	useEffect(() => {
		loadState();
	}, [props.show]);

	const handleChangeListType = async (e) => {
		setSelectedList(e.target.value);
	};

	return (
		<>
			<div className="add-item-popup" style={{ display: props.show }}>
				<div className="add-item-popup-body">
					<h1 className="add-item-popup-title">Settings</h1>
					<hr />
					<br />
					<div
						className="add-item-popup-upper-body"
						style={{ flexFlow: "column", gap: "20px" }}
					>
						<div>
							<p style={{ color: "white" }}>User lists</p>
							<div className="list-type-container">
								<select
									style={{ width: "100%" }}
									className="list-type-select item-select"
									onChange={(e) => handleChangeListType(e)}
								>
									{lists.map((listType) => (
										<option key={listType.id} value={listType.id}>
											{listType.name} -{" "}
											{users.find((user) => user.id == listType.user_id)?.name}
										</option>
									))}
								</select>
								<button
									className="add-list-button add-item-popup-button-cancel"
									style={{
										color: "red",
										display: "flex",
										gap: "10px",
										alignItems: "center",
										justifyContent: "center",
										width: "50px",
										padding: "0 10px",
									}}
									onClick={async () => {
										let isDeleteList = await confirm(
											"Delete: " +
												lists.find((list) => list.id == selectedList).name +
												(users.find(
													(user) =>
														user.id ==
														lists.find((list) => list.id == selectedList)
															?.user_id
												)?.name != null
													? " - " +
													  users.find(
															(user) =>
																user.id ==
																lists.find((list) => list.id == selectedList)
																	?.user_id
													  ).name
													: "") +
												"?"
										);
										if (isDeleteList == true) {
											if (
												await confirm(
													"All items in this list will be deleted. Are you sure?"
												)
											) {
												props.setIsPending(true);
												await invoke("delete_list_type", {
													id: parseInt(selectedList),
												});
												await invoke("get_list_types").then((listTypes) => {
													props.setListTypes(listTypes);
													setLists(listTypes);
													setSelectedList(listTypes[0].id);
													props.setCurrentListType(listTypes[0].id);
												});
												props.setIsPending(false);
											}
										}
									}}
								>
									<i className="fa-solid fa-trash"></i>
								</button>
							</div>
						</div>
						<div style={{ width: "100%" }}>
							<p style={{ color: "white" }}>Database Url</p>
							<div style={{ display: "flex", flexFlow: "row" }}>
								<input
									type="text"
									className="add-item-popup-input"
									style={{ borderRadius: "5px 0px 0px 5px" }}
									placeholder="dbuser:password@localhost:3306/dbname"
									value={props.appConfig.db_url}
									onChange={(e) =>
										props.setAppConfig({
											...props.appConfig,
											db_url: e.target.value,
										})
									}
								/>
								<button
									className="add-list-button concat-button"
									style={{
										backgroundColor: "#333",
										color: "white",
										borderRadius: "0px 5px 5px 0px",
										display: "flex",
										gap: "10px",
										alignItems: "center",
										justifyContent: "center",
										padding: "0 10px",
										width: "50px",
									}}
									onClick={async () => {
										props.setIsPending(true);
										await invoke("update_app_config", {
											dbUrl: props.appConfig.db_url,
										});
										props.runClear();
										props.setIsPending(false);
									}}
								>
									<i className="fa-solid fa-save"></i>
								</button>
							</div>
						</div>
					</div>
					<br />
					<div className="add-item-popup-footer">
						<div />
						<div className="add-item-popup-button-container">
							<button
								className="add-item-popup-button add-item-popup-button-confirm"
								style={{
									color: "white",
									display: "flex",
									gap: "10px",
									alignItems: "center",
								}}
								onClick={() => props.setShow("none")}
							>
								<i className="fa-solid fa-xmark"></i> Close
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
export default SettingsPopup;
