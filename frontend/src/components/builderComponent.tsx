import React from 'react';
import { InventoryStore } from '../inventoryStore'
import { observer } from "mobx-react-lite"
import { ItemBase } from './shared';

interface BuilderComponentProps {
    inventoryStore: InventoryStore
}

const BuilderComponent: React.FC<BuilderComponentProps> = ({ inventoryStore }) => {

    const ItemList = observer((props: BuilderComponentProps) =>
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3  gap-2 w-128">
                {props.inventoryStore.getRecipes.map((recipe, ix) => {
                    return <div className={`${ItemBase} px-1 ${recipe.buildResourceType === props.inventoryStore.selectedRecipe.buildResourceType ? 'border-2 border-green-500' : ''}`}
                        key={ix}
                        onClick={() => {
                            props.inventoryStore.recipeClicked(recipe.buildResourceType)
                        }}
                    >

                        <div className="capitalize font-bold">
                            {recipe.buildResourceType}
                        </div>
                        <div className="flex flex-row justify-center">
                            <img src={`/assets/${recipe.buildResourceType}.png`}></img>
                        </div>
                        Requires:
                        <div className="flex flex-col gap-1">
                            {
                                recipe.ingredients.map((ing, i) => {
                                    return <div key={i} className="capitalize">
                                        {`${ing.resourceType}: ${ing.amount}`}
                                    </div>
                                })
                            }
                        </div>
                    </div>
                })}
            </div>
            <div className="flex flex-row justify-center">
                {
                    inventoryStore.selectedRecipe.buildResourceType !== "" ?
                        <div className="hover:cursor-pointer hover:font-bold border-2 border-red-300 p-2 bg-white text-red-500"
                            onClick={() => { inventoryStore.unselectRecipe() }}>
                            Unselect
                        </div>
                        : <></>
                }
            </div>
        </>)

    return <div className="bg-gray-400 flex flex-col gap-4 select-none p-2">
        <div className="font-bold flex flex-row justify-center">
            Builder
        </div>
        <ItemList inventoryStore={inventoryStore} />
    </div>
}

export default BuilderComponent