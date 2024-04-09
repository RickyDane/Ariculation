import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { confirm } from "@tauri-apps/api/dialog";

function SettingsPopup(props) {
	const [lists, setLists] = useState(props.listTypes);
	const [users, setUsers] = useState(props.users);
	const [selectedList, setSelectedList] = useState(0);
	const [isSettingsLoading, setIsSettingsLoading] = useState(false);

	const loadState = async () => {
		setIsSettingsLoading(true);
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
		setIsSettingsLoading(false);
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
				<div className="add-item-popup-body" style={{ position: "relative" }}>
					<h1 className="add-item-popup-title">Settings</h1>
					<br />
					<div
						className="add-item-popup-upper-body"
						style={{ flexFlow: "column", gap: "20px" }}
					>
						<div>
							<p style={{ color: "white", marginBottom: "10px" }}>User lists</p>
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
										width: "45px",
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
							<h2
								style={{
									color: "white",
									marginBottom: "10px",
									fontWeight: "lighter",
								}}
							>
								Database
							</h2>
							<hr />
							<p className="text-normal" style={{ marginTop: "10px" }}>
								User
							</p>
							<input
								type="text"
								className="text-input"
								value={props.appConfig.db_user}
							/>
							<p className="text-normal" style={{ marginTop: "10px" }}>
								Password
							</p>
							<input
								type="password"
								className="text-input"
								value={props.appConfig.db_password}
							/>
							<p className="text-normal" style={{ marginTop: "10px" }}>
								Host
							</p>
							<input
								type="text"
								className="text-input"
								value={props.appConfig.db_host}
							/>
							<p className="text-normal" style={{ marginTop: "10px" }}>
								Port
							</p>
							<input
								type="text"
								className="text-input"
								value={props.appConfig.db_port}
							/>
							<p className="text-normal" style={{ marginTop: "10px" }}>
								Database
							</p>
							<input
								type="text"
								className="text-input"
								value={props.appConfig.db_name}
							/>
							<label
								htmlFor="settings-is-ssl"
								style={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									cursor: "pointer",
									marginTop: "10px",
								}}
							>
								<input
									id="settings-is-ssl"
									className="add-item-popup-checkbox"
									type="checkbox"
									checked={props.appConfig.is_use_ssl}
									onChange={() =>
										props.setAppConfig({
											...props.appConfig,
											is_ssl: !props.appConfig.is_ssl,
										})
									}
								/>
								<p className="text-normal">Use SSL</p>
							</label>
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
				<div
					className="pending-loader-container"
					style={{ display: isSettingsLoading == true ? "block" : "none" }}
				>
					<div className="pending-loader"></div>
				</div>
			</div>
		</>
	);
}
export default SettingsPopup;
