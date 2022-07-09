import React from 'react';
import { InventoryStore } from '../inventoryStore'
import { observer } from "mobx-react-lite"
import { ItemBase } from './shared';

interface InventoryComponentProps {
    inventoryStore: InventoryStore
}

const InventoryComponent: React.FC<InventoryComponentProps> = ({ inventoryStore }) => {
    const ItemList = observer((props: InventoryComponentProps) => <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 w-128">
        {props.inventoryStore.getItems.map((i, ix) => {
            return <div key={ix} className={`${ItemBase} ${props.inventoryStore.selectedItems.includes(i.resourceType) ? 'border-green-500' : ''}`}
                onClick={() => {
                    props.inventoryStore.itemClicked(i.resourceType)
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
        <div className="col-span-1"></div>
        <div className="col-span-1"></div>
    </div>)

    return <div className="bg-gray-400 flex flex-col gap-4 select-none p-2">
        <div className="font-bold flex flex-row justify-center">
            Inventory
        </div>
        <ItemList inventoryStore={inventoryStore} />
    </div>
}

export default InventoryComponent