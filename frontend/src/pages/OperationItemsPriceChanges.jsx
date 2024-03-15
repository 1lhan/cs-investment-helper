import { batch, useSignal } from "@preact/signals-react"
import { useSelector } from "react-redux"
import CustomSelect from "../components/CustomSelect"
import Bubbles from "../components/Bubbles"
import { dynamicTitle } from "../utils"

export default function OperationItemsPricesChanges() {
    const { events, blue } = useSelector(state => state.slice)
    const eventName = useSignal('-')
    const itemType = useSignal('-')
    const data = useSignal([])
    const averageValues = useSignal({})
    const sortValue = useSignal(-1)
    const isLoading = useSignal(false)

    dynamicTitle(window.location.pathname.slice(1).replaceAll('-', ' '))

    const getOperationItemsPriceChangesData = async () => {
        if (eventName == '-' || itemType == '-') return false
        batch(() => {
            sortValue.value = -1
            isLoading.value = true
            data.value = []
            averageValues.value = {}
        })

        let getData = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/get-operation-items-price-changes-data/${eventName}/${itemType}`).then(res => res.json())

        if (getData.success) {
            batch(() => {
                isLoading.value = false
                data.value = getData[itemType]
                averageValues.value = getData[itemType + 'AverageValues']
            })
        }
        else return false
    }

    const sorter = () => {
        let _data = data.value.slice(0)

        if (sortValue == 1 || sortValue == 2) _data.sort((a, b) => b.minPriceDuringOperation[0] - a.minPriceDuringOperation[0])
        else if (sortValue == 3 || sortValue == 4) _data.sort((a, b) => b.highestPrice[0] - a.highestPrice[0])
        else if (sortValue == 5 || sortValue == 6) _data.sort((a, b) => b.highestPrice[1] - a.highestPrice[1])

        data.value = sortValue % 2 == 0 ? _data.reverse() : _data
    }

    return (
        <div className="operation-items-price-changes-page container">
            <div className="top-div">
                <h2><i className="fa-solid fa-table-list" />Operation Items Price Changes</h2>
                <div className="get-data-settings">
                    <CustomSelect id='eventName' title={'Select Operation'} state={eventName} options={events.filter(item => item.eventType == 'operation').map(item => { return item.name })} width='14rem'
                        func={() => { itemType.value = '-' }} />
                    <CustomSelect id='itemType' title={'Select Item Type'} state={itemType} width='10rem' options={eventName.value == '-' ? [] : events.find(item => item.name == eventName).eventItems} />
                    <button className="btn" onClick={() => getOperationItemsPriceChangesData()}>Get Data</button>
                </div>
            </div>
            <section className="template-style-wrapper">
                {data.value.length > 0 &&
                    <div className="field-names">
                        <span className="image">Img</span>
                        <span className="field-names-item item-name">Item Name</span>
                        <span className="field-names-item min-price-during-operation">
                            <span onClick={() => { sortValue.value = sortValue == 2 ? 1 : 2; sorter() }} style={{ color: sortValue == 2 || sortValue == 1 ? blue : '' }}>Min Price During Operation</span>
                        </span>
                        <span className="field-names-item highest-price">
                            <span onClick={() => { sortValue.value = sortValue == 4 ? 3 : 4; sorter() }} style={{ color: sortValue == 4 || sortValue == 3 ? blue : '' }}>Highest Price</span>
                            <span onClick={() => { sortValue.value = sortValue == 6 ? 5 : 6; sorter() }} style={{ color: sortValue == 6 || sortValue == 5 ? blue : '' }}>(x)</span>
                        </span>
                    </div>
                }
                {Object.keys(averageValues.value).length > 0 && <div className="average-values">
                    <div className="image-wrapper">
                        <span className="image" />
                    </div>
                    <span className="average-values-item item-name">Average Values :</span>
                    <span className="average-values-item min-price-during-operation">
                        <span>{averageValues.value.minPriceDuringOperation}</span>
                    </span>
                    <span className="average-values-item highest-price">
                        <span>{averageValues.value.highestPrice[0]}</span>
                        <span>{`(${averageValues.value.highestPrice[1]}x)`}</span>
                    </span>
                </div>}
                {isLoading.value && <div className="bubbles-wrapper"><Bubbles /></div>}
                {data.value.length > 0 && data.value.map((item, index) =>
                    <div className="item-div" key={index}>
                        <div className="image-wrapper">
                            <img className="image" src={'https://api.steamapis.com/image/item/730/' + item.name} />
                            <div className="tool-tip mobile-size-tool-tip tool-tip-from-left">
                                <span>{item.name}</span>
                            </div>
                        </div>
                        <span className="item-div-children item-name">{item.name}</span>
                        <span className="item-div-children min-price-during-operation">
                            <span>{item.minPriceDuringOperation[0]}</span>
                            <div className="tool-tip">
                                {item.minPriceDuringOperation[item.minPriceDuringOperation.length - 1].map((item2, index2) =>
                                    <span key={index2}>{`${item2[0]} | ${item2[1]} | ${item2[2]}`}</span>
                                )}
                            </div>
                        </span>
                        <span className="item-div-children highest-price">
                            <span>{item.highestPrice[0]}</span>
                            <span>{`(${item.highestPrice[1]}x)`}</span>
                            <div className="tool-tip tool-tip-from-right">
                                {item.highestPrice[item.highestPrice.length - 1].map((item2, index2) =>
                                    <span key={index2}>{`${item2[0]} | ${item2[1]} | ${item2[2]}`}</span>
                                )}
                            </div>
                        </span>
                    </div>
                )}
            </section >
        </div >
    )
}