import { useEffect, useState } from "react";

function EditItemPopup(props) {
  const [itemName, setItemName] = useState(props.item.name);
    const [itemCategory, setItemCategory] = useState(props.item.category);
    const [itemPerson, setItemPerson] = useState(props.item.person);
    const [itemDescription, setItemDescription] = useState(props.item.description);
    const [itemPrice, setItemPrice] = useState(props.item.price);
    const [itemSplit, setItemSplit] = useState(props.item.split);
    const handleNameChange = (e) => {
      setItemName(e.target.value);
    }
    const handleCategoryChange = (e) => {
      setItemCategory(e.target.value);
    }
    const handlePersonChange = (e) => {
      setItemPerson(e.target.value);
    }
    const handleDescriptionChange = (e) => {
      setItemDescription(e.target.value);
    }
    const handlePriceChange = (e) => {
      setItemPrice(e.target.value);
    }
    const handleSplitChange = (e) => {
      setItemSplit(e.target.checked);
    }
    const handleEditItem = () => {
      let newItem = {
        id: crypto.randomUUID(),
        name: itemName,
        category: itemCategory,
        description: itemDescription,
        user: itemPerson,
        price: itemPrice,
        split: itemSplit
      }
      props.setItems(props.items.map(item => item.id === props.item.id ? newItem : item));
      props.setShow("none");
    }
    const refreshPopup = () => {
      setItemName(props.item.name);
      setItemCategory(props.item.category);
      setItemPerson(props.item.user);
      setItemDescription(props.item.description);
      setItemPrice(props.item.price);
      setItemSplit(props.item.split);
    }

    useEffect(() => {
      refreshPopup();
    }, [props.item]);

    return (
      <>
        <div className="add-item-popup" style={{display: props.show}}>
          <h1 className="add-item-popup-title">Edit Item</h1>
          <div className="add-item-popup-body">
            <div className="add-item-popup-upper-body">
              <div className="add-item-popup-left-body">
                <input type="text" className="add-item-popup-input" value={itemName} onChange={handleNameChange} placeholder="Name" />
                <input type="text" className="add-item-popup-input" value={itemCategory} onChange={handleCategoryChange} placeholder="Category" />
                <input type="text" className="add-item-popup-input" value={itemPerson} onChange={handlePersonChange} placeholder="Person" />
              </div>
              <div className="add-item-popup-right-body">
                <textarea className="add-item-popup-textarea" value={itemDescription} onChange={handleDescriptionChange} placeholder="Description"></textarea>
              </div>
            </div>
            <div className="add-item-popup-bottom-body">
              <input type="number" className="add-item-popup-input add-item-popup-input-price" value={parseFloat(itemPrice).toFixed(2)} onChange={handlePriceChange} placeholder="0,00 €" />
            </div>
            <div className="add-item-popup-footer">
              <div className="add-item-popup-checkbox-container">
                <input id="split-checkbox" type="checkbox" className="add-item-popup-checkbox" checked={itemSplit} onChange={handleSplitChange} />
                <label htmlFor="split-checkbox" className="add-item-popup-checkbox-label">Split</label>
              </div>
              <div className="add-item-popup-button-container">
                <button className="add-item-popup-button add-item-popup-button-cancel" onClick={() => props.setShow("none")}>Cancel</button>
                <button className="add-item-popup-button add-item-popup-button-confirm" onClick={handleEditItem}>Save</button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
}
export default EditItemPopup;
