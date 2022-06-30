import React from 'react';
import { InventoryStore } from './inventoryStore'
import { observer } from "mobx-react-lite"

interface InventoryComponentProps {
    inventoryStore: InventoryStore
}

const InvetoryItemBase = "bg-gray-200 pb-1 hover:bg-gray-300 cursor-pointer flex flex-col justify-center text-center border-2 "

const InventoryComponent: React.FC<InventoryComponentProps> = ({ inventoryStore }) => {
    const ItemList = observer((props: InventoryComponentProps) => <div className="grid grid-cols-3  gap-2 w-128">
        {props.inventoryStore.getItems.map((i, ix) => {
            return <div key={ix} className={`${InvetoryItemBase} ${props.inventoryStore.selectedItem === i.resourceType ? 'border-green-500' : ''}`}
                onClick={() => {
                    if (props.inventoryStore.selectedItem === i.resourceType) {
                        // if its selected -> unselect
                        props.inventoryStore.setSelectedItem("")
                    } else {
                        props.inventoryStore.setSelectedItem(i.resourceType)
                    }
                }}
            >
                <div className="mx-1 capitalize font-bold">
                    {`${i.resourceType}`}
                </div>
                <div className="-my-2 flex flex-row justify-center">
                    <img src={`/assets/${i.resourceType}.png`}></img>
                </div>
                <div className="mx-1">
                    {`x${i.quantity}`}
                </div>
            </div>
        })}
        <div></div>
        <div></div>
    </div>)

    return <div className="bg-gray-400 flex flex-col gap-4 select-none p-2">
        <div className="font-bold flex flex-row justify-center">
            Inventory
        </div>
        <ItemList inventoryStore={inventoryStore} />
    </div>
}

export default InventoryComponent