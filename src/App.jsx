import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import "./styles.css";
import "./font-awesome/js/all.min.js";
import "./font-awesome/css/all.min.css";
import AddItemPopup from "./AddItemPopup";
import EditItemPopup from "./EditItemPopup";
import AddUserPopup from "./AddUserPopup";
import QuestionPopup from "./QuestionPopup";
import NewListInput from "./NewListInput";
import SettingsPopup from "./SettingsPopup";
import AskPasswordInput from "./AskPasswordInput.jsx";
import ShoppingListPopup from "./ShoppingListPopup.jsx";

let IsAppFirstRun = true;

function App() {
	const [items, setItems] = useState([]);
	const [showAddItemPopup, setShowAddItemPopup] = useState("none");
	const [showEditItemPopup, setShowEditItemPopup] = useState("none");
	const [showAddUserPopup, setShowAddUserPopup] = useState("none");
	const [showTooltipInput, setShowTooltipInput] = useState("none");
	const [showShoppingListPopup, setShowShoppingListPopup] = useState("none");
	const [editItem, setEditItem] = useState({});
	const [isAllItemsActive, setIsAllItemsActive] = useState(false);
	const [isJointActive, setIsJointActive] = useState(false);
	const [users, setUsers] = useState([]);
	const [activeUserId, setActiveUserId] = useState(0);
	const [currentMoney, setCurrentMoney] = useState("0");
	const [showQuestionPopup, setShowQuestionPopup] = useState("none");
	const [confirmFunction, setConfirmFunction] = useState(() => {});
	const [questionPopupMsg, setQuestionPopupMsg] = useState("");
	const [currentItem, setCurrentItem] = useState({});
	const [currentView, setCurrentView] = useState("");
	const [listTypes, setListTypes] = useState([]);
	const [currentListType, setCurrentListType] = useState(0);
	const [isPending, setIsPending] = useState(false);
	const [showSettingsPopup, setShowSettingsPopup] = useState("none");
	const [currentUserFilter, setCurrentUserFilter] = useState(0);
	const [appConfig, setAppConfig] = useState({});
	const [showAskPasswordInput, setShowAskPasswordInput] = useState("none");
	const [typedInPassword, setTypedInPassword] = useState("");
	const [listToCheck, setListToCheck] = useState({});
	const [lastJointListType, setLastJointListType] = useState(0);

	const getUsers = async () => {
		await invoke("get_users").then((users) => setUsers(users));
	};

	const checkOrCreateDB = async () => {
		setIsPending(true);
		await invoke("check_or_create_db").then(async () => {
			await getUsers();
			IsAppFirstRun = false;
		});
		setIsPending(false);
	};

	useEffect(() => {
		if (IsAppFirstRun == true) {
			checkOrCreateDB();
			invoke("get_app_config").then((config) => {
				if (config.db_url == "dbuser:dbpassword@dbserver:dbport") {
					alert("Database not configured");
				} else {
					setAppConfig(config);
				}
			});
		}
	}, []);

	const setCurrentListMoney = async (listType) => {
		if (listType != 0 && listType != null) {
			await invoke("get_list_type", { id: parseInt(listType) }).then(
				(listType) =>
					setCurrentMoney(parseFloat(listType.list_money).toFixed(2).toString())
			);
		}
	};

	const loadSite = async (listType = currentListType) => {
		setIsPending(true);
		switch (currentView) {
			case "all":
				await invoke("get_all_items").then((items) => {
					setItems(
						items.filter(
							(item) =>
								item.list_type !=
								listTypes.find((list) => list.list_password != "")?.id
						)
					);
				});
				break;
			case "user":
				await invoke("get_user_items", {
					userId: activeUserId,
					listType: parseInt(listType),
				}).then((items) => setItems(items));
				break;
			case "joint":
				await invoke("get_items", {
					isSplit: true,
					isJoint: true,
					listType: parseInt(listType),
				}).then((items) => setItems(items));
				break;
			default:
				console.log("Invalid view: ", currentView);
				break;
		}
		await setCurrentListMoney(listType);
		setIsPending(false);
	};

	useEffect(() => {
		if (currentView == "joint") {
			setCurrentListType(lastJointListType);
		} else if (currentView == "") {
			setCurrentListType(0);
		} else if (currentView == "all") {
			setCurrentListType(0);
		} else {
			setCurrentListType(
				users.find((user) => user.id == activeUserId)?.last_list_id
			);
		}
	}, [listTypes, currentView]);

	useEffect(() => {
		loadSite(currentListType);
	}, [currentListType, currentView]);

	let saveLastListId = async (listType) => {
		await invoke("update_user_last_list_type", {
			userId: activeUserId,
			listType: parseInt(listType),
		});
		setUsers(
			users.map((user) =>
				user.id == activeUserId ? { ...user, last_list_id: listType } : user
			)
		);
		if (currentView == "joint") {
			setLastJointListType(listType);
		}
	};

	useEffect(() => {
		document.querySelector(".newlist-name-input").focus();
	}, [showTooltipInput]);

	const updateListMoney = async (e) => {
		if (
			isAllItemsActive == true ||
			(isJointActive &&
				!listTypes.find((list) => list.id == currentListType).is_joint)
		)
			return;
		if (e.key === "Enter") {
			setIsPending(true);
			await invoke("update_list_money", {
				listMoney: e.target.value.toString().replace(",", "."),
				userId: activeUserId,
				id: parseInt(currentListType),
			});
			e.target.blur();
			setIsPending(false);
		}
	};

	const runClear = async () => {
		setIsPending(true);
		await updateCurrentView("Ariculation", "", { id: 0 });
		setItems([]);
		getUsers();
		setIsPending(false);
	};

	const refreshListTypes = async (userId = null) => {
		await invoke("get_list_types").then((types) => {
			if (types.length > 0) {
				setListTypes(types);
			}
		});
	};

	const updateCurrentView = async (windowTitle, currentView, user) => {
		await unselectAllNavLinks();
		await refreshListTypes(user.id);
		appWindow.setTitle(windowTitle);
		setActiveUserId(user.id);
		setCurrentView(currentView);
	};

	const showAllItems = async () => {
		await updateCurrentView("Ariculation - All Items", "all", { id: 0 });
		setIsAllItemsActive(true);
		document
			.querySelector(".allItems-button")
			.classList.add("site-nav-link-active");
	};

	const showJoint = async () => {
		await updateCurrentView("Ariculation - Joint", "joint", { id: 0 });
		setIsJointActive(true);
		document
			.querySelector(".joint-button")
			.classList.add("site-nav-link-active");
	};

	const showUser = async (user) => {
		await updateCurrentView("Ariculation - " + user.name, "user", user);
		document
			.querySelector(".user-button-" + user.id)
			.classList.add("site-nav-link-active");
	};

	const deleteItem = async (id) => {
		await invoke("delete_item", { id: id });
		setItems(items.filter((item) => item.id != id));
	};

	const openQuestionPopup = (item, question, confirmFunction) => {
		setShowQuestionPopup("block");
		setConfirmFunction(() => confirmFunction);
		setQuestionPopupMsg(question);
		setCurrentItem(item);
	};

	const unselectAllNavLinks = async () => {
		setIsJointActive(false);
		setIsAllItemsActive(false);
		document
			.querySelectorAll(".site-nav-link")
			.forEach((link) => link.classList.remove("site-nav-link-active"));
	};

	const handleSearchInput = async (e) => {
		setIsPending(true);
		if (isAllItemsActive) {
			await invoke("get_all_items", {
				listType: parseInt(currentListType),
			}).then((items) => {
				setItems(
					items.filter(
						(item) =>
							item.name.toLowerCase().includes(e.target.value.toLowerCase()) ==
								true ||
							item.category
								.toLowerCase()
								.includes(e.target.value.toLowerCase()) == true
					)
				);
			});
		} else if (isJointActive) {
			await invoke("get_items", {
				isSplit: true,
				isJoint: true,
				listType: parseInt(currentListType),
			}).then((items) => {
				setItems(
					items.filter(
						(item) =>
							item.name.toLowerCase().includes(e.target.value.toLowerCase()) ==
								true ||
							item.category
								.toLowerCase()
								.includes(e.target.value.toLowerCase()) == true
					)
				);
			});
		} else if (activeUserId != 0) {
			await invoke("get_user_items", {
				userId: activeUserId,
				listType: parseInt(currentListType),
			}).then((items) => {
				setItems(
					items.filter(
						(item) =>
							item.name.toLowerCase().includes(e.target.value.toLowerCase()) ==
								true ||
							item.category
								.toLowerCase()
								.includes(e.target.value.toLowerCase()) == true
					)
				);
			});
		}
		setIsPending(false);
	};

	const handleChangeListType = async (e) => {
		setIsPending(true);
		if (
			listTypes.find((list) => list.id == parseInt(e.target.value))
				.list_password.length > 0
		) {
			setListToCheck(
				listTypes.find((list) => list.id == parseInt(e.target.value))
			);
			setShowAskPasswordInput("flex");
			return;
		}
		setCurrentListType(parseInt(e.target.value));
		await saveLastListId(parseInt(e.target.value));
		setIsPending(false);
	};

	const openSettings = async () => {
		setShowSettingsPopup("flex");
	};

	useEffect(() => {
		setIsPending(true);
		invoke("get_userfiltered_items", {
			listType: parseInt(currentListType) > 0 ? parseInt(currentListType) : 0,
			userId: parseInt(currentUserFilter),
			isAllItems: isAllItemsActive,
		}).then((items) => {
			setItems(
				items.filter(
					(item) =>
						item.list_type !=
						listTypes.find((list) => list.list_password != "")?.id
				)
			);
		});
		setIsPending(false);
	}, [currentUserFilter]);

	const handlePasswordInput = async () => {
		if (listToCheck.list_password == typedInPassword) {
			setShowAskPasswordInput("none");
			setIsPending(true);
			setCurrentListType(listToCheck.id);
			setIsPending(false);
		}
	};

	return (
		<>
			<div className="page">
				<div className="site-nav">
					<h1 className="site-nav-title" onClick={runClear}>
						Ariculation
					</h1>
					<div className="hr-divider"></div>
					<div className="site-nav-links">
						<button
							className="site-nav-link allItems-button"
							onClick={showAllItems}
						>
							<div className="nav-link-button-icon">
								<i className="fa-solid fa-chart-line"></i>
							</div>
							<div className="nav-link-button-text">All items</div>
						</button>
						<button className="site-nav-link joint-button" onClick={showJoint}>
							<div className="nav-link-button-icon">
								<i className="fa-solid fa-arrows-to-circle"></i>
							</div>
							<div className="nav-link-button-text">Joint</div>
						</button>
						{users.map((user) => (
							<button
								className={"site-nav-link user-button-" + user.id}
								key={user.id}
								onClick={async (e) => await showUser(user, e)}
							>
								<div className="nav-link-button-icon">
									<i className="fa-solid fa-user"></i>
								</div>
								<div className="nav-link-button-text">{user.name}</div>
							</button>
						))}
					</div>
					<div className="site-nav-settings-bar">
						<button
							className="site-nav-settings-button"
							onClick={() => setShowShoppingListPopup("flex")}
						>
							<i className="fa-solid fa-mobile-screen-button"></i>
						</button>
						<button
							className="add-user-button"
							onClick={() => setShowAddUserPopup(true)}
						>
							<i className="fa-solid fa-user-plus"></i>
						</button>
						<button className="site-nav-settings-button" onClick={openSettings}>
							<i className="fa-solid fa-gears"></i>
						</button>
					</div>
				</div>
				<div className="main-container">
					<div
						className="pending-loader-container"
						style={{ display: isPending == true ? "block" : "none" }}
					>
						<div
							className="pending-loader"
							style={{ display: isPending == true ? "block" : "none" }}
						></div>
					</div>
					<div className="toolbar">
						<input
							type="text"
							results={"5"}
							name="s"
							className="text-input search-input"
							placeholder="Search ..."
							onKeyUp={async (e) => {
								if (e.key === "Enter") {
									handleSearchInput(e);
								}
							}}
						/>
						<div style={{ display: "flex", gap: "5px" }}>
							<button
								className="add-item-button"
								style={{
									display:
										currentView != null &&
										currentView != "" &&
										!isAllItemsActive
											? "flex"
											: "none",
								}}
								onClick={() => setShowAddItemPopup("block")}
							>
								Add item <i className="fa-solid fa-circle-plus"></i>
							</button>
							<div
								className="list-type-container"
								style={{
									display:
										currentView != null &&
										currentView != "" &&
										!isAllItemsActive
											? "flex"
											: "none",
								}}
							>
								<select
									className="list-type-select item-select"
									value={currentListType}
									onChange={(e) => handleChangeListType(e)}
								>
									{listTypes
										.filter(
											(listType) =>
												(listType.is_joint == isJointActive &&
													listType.user_id == activeUserId) ||
												isAllItemsActive == true
										)
										.map((listType) => (
											<option key={listType.id} value={listType.id}>
												{listType.name}
												{isJointActive &&
												users.find((user) => user.id == listType.user_id)
													?.name != null
													? " - " +
													  users.find((user) => user.id == listType.user_id)
															?.name
													: ""}
											</option>
										))}
								</select>
								<button
									className="add-list-button concat-button"
									onClick={() => setShowTooltipInput("block")}
								>
									<i className="fa-solid fa-plus"></i>
								</button>
							</div>
						</div>
					</div>
					<table className="item-list">
						<thead className="item-list-header">
							<tr>
								<th>Name</th>
								<th>Category</th>
								<th>Price</th>
								<th>User</th>
								<th>Split</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item) => (
								<tr key={item.id} className="list-item">
									<td>{item.name}</td>
									<td>{item.category}</td>
									<td>
										{parseFloat(item.price)
											.toFixed(2)
											.toString()
											.replace(".", ",")}{" "}
										{"€"}
									</td>
									<td>{users.find((user) => user.id == item.user_id)?.name}</td>
									<td>
										{item.is_split == true
											? parseFloat(item.price / users.length)
													.toFixed(2)
													.toString()
													.replace(".", ",")
											: "-"}
									</td>
									<td>
										<div className="item-action-buttons">
											<button
												className="item-action-button"
												onClick={() => {
													setShowEditItemPopup("block");
													setEditItem(item);
												}}
											>
												<i className="fa-solid fa-pencil"></i>
											</button>
											<button
												className="item-action-button item-action-button-delete"
												onClick={() =>
													openQuestionPopup(
														item,
														"Should this item be deleted?",
														() => deleteItem(item.id)
													)
												}
											>
												<i className="fa-solid fa-trash"></i>
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<div className="page-sum-footer">
						<div style={{ display: "flex" }}>
							{"Start: "}
							<input
								type="text"
								className="monthly-money-money"
								value={currentMoney.toString().replace(".", ",")}
								onChange={(e) => setCurrentMoney(e.target.value)}
								onKeyUp={updateListMoney}
							/>
						</div>
						<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
							<div
								style={{ display: "flex", gap: "10px", alignItems: "center" }}
							>
								{"Filter: "}
								<select
									className="item-select"
									value={currentUserFilter}
									onChange={(e) => setCurrentUserFilter(e.target.value)}
									style={{ minWidth: "0", width: "100px" }}
								>
									<option value="0">All</option>
									{users.map((user) => (
										<option key={user.id} value={user.id}>
											{user.name}
										</option>
									))}
								</select>
								{items.length > 0
									? (
											items
												.filter((item) => item.is_split == true)
												.reduce(
													(pre, item) =>
														parseFloat(pre) +
														parseFloat(item.price) / users.length,
													0
												) +
											items
												.filter((item) => item.is_split == false)
												.reduce(
													(acc, item) =>
														parseFloat(acc) + parseFloat(item.price),
													0
												)
									  )
											.toFixed(2)
											.toString()
											.replace(".", ",") + " €"
									: ""}
							</div>
							<div style={{ display: "flex", gap: "5px" }}>
								{items.length > 0 ? "Total:" : "No items"}
								<p style={{ color: "white" }}>
									{items.length > 0
										? parseFloat(
												parseFloat(currentMoney.toString().replace(",", ".")) +
													items
														.filter((item) => item.is_split == true)
														.reduce(
															(pre, item) =>
																parseFloat(pre) +
																parseFloat(item.price) / users.length,
															0
														) +
													items
														.filter((item) => item.is_split == false)
														.reduce(
															(acc, item) =>
																parseFloat(acc) + parseFloat(item.price),
															0
														)
										  )
												.toFixed(2)
												.toString()
												.replace(".", ",") + " €"
										: ""}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			<AddItemPopup
				setItems={setItems}
				items={items}
				setShow={setShowAddItemPopup}
				show={showAddItemPopup}
				isJoint={isJointActive}
				users={users}
				activeUserId={activeUserId}
				currentView={currentView}
				currentListType={currentListType}
				listTypes={listTypes}
			/>
			<EditItemPopup
				setItems={setItems}
				items={items}
				setShow={setShowEditItemPopup}
				show={showEditItemPopup}
				isJoint={isJointActive}
				users={users}
				activeUserId={activeUserId}
				currentView={currentView}
				currentListType={currentListType}
				listTypes={listTypes}
				item={editItem}
			/>
			<AddUserPopup
				users={users}
				setUsers={setUsers}
				setShow={setShowAddUserPopup}
				show={showAddUserPopup}
				setIsPending={setIsPending}
			/>
			<QuestionPopup
				setShow={setShowQuestionPopup}
				show={showQuestionPopup}
				confirmFunction={confirmFunction}
				msg={questionPopupMsg}
				item={currentItem}
			/>
			<NewListInput
				setShow={setShowTooltipInput}
				show={showTooltipInput}
				setListTypes={setListTypes}
				setIsPending={setIsPending}
				isJoint={isJointActive}
				activeUserId={activeUserId}
			/>
			<SettingsPopup
				users={users}
				setShow={setShowSettingsPopup}
				show={showSettingsPopup}
				setListTypes={setListTypes}
				setIsPending={setIsPending}
				isJoint={isJointActive}
				activeUserId={activeUserId}
				listTypes={listTypes}
				setCurrentListType={setCurrentListType}
				appConfig={appConfig}
				setAppConfig={setAppConfig}
				runClear={runClear}
			/>
			<AskPasswordInput
				users={users}
				setShow={setShowAskPasswordInput}
				show={showAskPasswordInput}
				setIsPending={setIsPending}
				activeUserId={activeUserId}
				runClear={runClear}
				password={typedInPassword}
				setPassword={setTypedInPassword}
				handlePasswordInput={handlePasswordInput}
			/>
			<ShoppingListPopup
				setShow={setShowShoppingListPopup}
				show={showShoppingListPopup}
			/>
		</>
	);
}

export default App;
