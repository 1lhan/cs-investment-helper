import { batch, useSignal } from "@preact/signals-react"
import { useSelector } from "react-redux"
import CustomSelect from "../components/CustomSelect"
import Bubbles from "../components/Bubbles"
import { dynamicTitle } from "../utils"

export default function MajorItemsPricesChanges() {
    const { events, blue } = useSelector(state => state.slice)
    const eventName = useSignal('-')
    const itemType = useSignal('-')
    const stickerType = useSignal('-')
    const getMinPriceAfterSale = useSignal(false)
    const data = useSignal([])
    const averageValues = useSignal({})
    const sortValue = useSignal(-1)
    const isLoading = useSignal(false)

    dynamicTitle(window.location.pathname.slice(1).replaceAll('-', ' '))

    const getMajorItemsPriceChangesData = async () => {
        if (eventName == '-' || itemType == '-' || (eventName != '-' && (itemType == 'stickers' || itemType == 'autographs') && stickerType == '-') || (itemType == 'patches' && stickerType == '-')) return false
        batch(() => {
            sortValue.value = -1
            data.value = []
            averageValues.value = {}
            isLoading.value = true
        })

        let getData = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/get-major-items-price-changes-data/${eventName}/${itemType}/${stickerType}`).then(res => res.json())

        if (getData.success) {
            batch(() => {
                isLoading.value = false
                getMinPriceAfterSale.value = events.find(item => item.name == eventName).dates['min-price-after-sale'] != false ? true : false
                data.value = getData[itemType]
                averageValues.value = getData[itemType + 'AverageValues']
            })
        }
        else return false
    }

    const sorter = () => {
        let _data = data.value.slice(0)

        if (sortValue == 1 || sortValue == 2) _data.sort((a, b) => b.priceBeforeSale[0] - a.priceBeforeSale[0])
        else if (sortValue == 3 || sortValue == 4) _data.sort((a, b) => b.minPriceDuringSale[0] - a.minPriceDuringSale[0])
        else if (sortValue == 5 || sortValue == 6) _data.sort((a, b) => b.minPriceDuringSale[1] - a.minPriceDuringSale[1])
        else if (sortValue == 7 || sortValue == 8) _data.sort((a, b) => b.minPriceAfterSale[0] - a.minPriceAfterSale[0])
        else if (sortValue == 9 || sortValue == 10) _data.sort((a, b) => b.minPriceAfterSale[1] - a.minPriceAfterSale[1])
        else if (sortValue == 11 || sortValue == 12) _data.sort((a, b) => b.highestPrice[0] - a.highestPrice[0])
        else if (sortValue == 13 || sortValue == 14) _data.sort((a, b) => b.highestPrice[1] - a.highestPrice[1])
        else if (sortValue == 15 || sortValue == 16) _data.sort((a, b) => b.highestPrice[2] - a.highestPrice[2])

        data.value = sortValue % 2 == 0 ? _data.reverse() : _data
    }

    return (
        <div className="major-items-price-changes-page container">
            <div className="top-div">
                <h2><i className="fa-solid fa-table-list" />Major Items Price Changes</h2>
                <div className="get-data-settings">
                    <CustomSelect id='eventName' title={'Choose Tournament'} state={eventName} width='11rem' options={events.filter(item => item.eventType == 'tournament').map(item => { return item.name })}
                        func={() => { itemType.value = '-'; stickerType.value = '-' }}
                    />
                    <CustomSelect id='itemType' title={'Choose Item Type'} state={itemType} width='12rem' options={eventName.value == '-' ? [] : events.find(item => item.name == eventName).eventItems}
                        func={() => { stickerType.value = '-' }}
                    />
                    <CustomSelect id='stickerType' title={'Choose Sticker Type'} state={stickerType} width='11rem'
                        options={(eventName.value == 'Stockholm-2021' && itemType.value == 'autographs') ? ['Paper', 'Holo', 'Gold'] :
                            (eventName.value == 'Stockholm-2021' && itemType.value == 'patches') ? ['Paper', 'Gold'] : itemType.value == 'stickers' || itemType.value == 'autographs' ?
                                events.find(item => item.name == eventName).stickerTypes : []}
                    />
                    <button className="btn" onClick={() => getMajorItemsPriceChangesData()}>Get Data</button>
                </div>
            </div>
            <section className="template-style-wrapper">
                {data.value.length > 0 && <div className="field-names">
                    <span className="image">Img</span>
                    <span className="field-names-item item-name">Item Name</span>
                    <span className="field-names-item price-before-sale">
                        <span onClick={() => { sortValue.value = sortValue == 2 ? 1 : 2; sorter() }} style={{ color: sortValue == 1 || sortValue == 2 ? blue : '' }} >Price Before Sale</span>
                    </span>
                    <span className="field-names-item min-price-during-sale">
                        <span onClick={() => { sortValue.value = sortValue == 4 ? 3 : 4; sorter() }} style={{ color: sortValue == 4 || sortValue == 3 ? blue : '' }}>Min Price During Sale</span>
                        <span onClick={() => { sortValue.value = sortValue == 6 ? 5 : 6; sorter() }} style={{ color: sortValue == 6 || sortValue == 5 ? blue : '' }}>(%)</span>
                    </span>
                    {getMinPriceAfterSale.value && <span className="field-names-item min-price-after-sale">
                        <span onClick={() => { sortValue.value = sortValue == 8 ? 7 : 8; sorter() }} style={{ color: sortValue == 8 || sortValue == 7 ? blue : '' }}>Min Price After Sale</span>
                        <span onClick={() => { sortValue.value = sortValue == 10 ? 9 : 10; sorter() }} style={{ color: sortValue == 10 || sortValue == 9 ? blue : '' }}>(%)</span>
                    </span>}
                    <span className="field-names-item highest-price">
                        <span onClick={() => { sortValue.value = sortValue == 12 ? 11 : 12; sorter() }} style={{ color: sortValue == 12 || sortValue == 11 ? blue : '' }}>Highest Price</span>
                        <span onClick={() => { sortValue.value = sortValue == 14 ? 13 : 14; sorter() }} style={{ color: sortValue == 14 || sortValue == 13 ? blue : '' }}>(x)</span>
                        {getMinPriceAfterSale.value && <span onClick={() => { sortValue.value = sortValue == 16 ? 15 : 16; sorter() }} style={{ color: sortValue == 16 || sortValue == 15 ? blue : '' }}>(x)</span>}
                    </span>
                </div>}

                {Object.keys(averageValues.value).length > 0 && <div className="average-values">
                    <div className="image-wrapper">
                        <span className="image" />
                    </div>
                    <span className="average-values-item item-name">Average Values :</span>
                    <span className="average-values-item">
                        <span>{averageValues.value.priceBeforeSale}</span>
                    </span>
                    <span className="average-values-item">
                        <span>{averageValues.value.minPriceDuringSale[0]}</span>
                        <span>{`(${averageValues.value.minPriceDuringSale[1]}%)`}</span>
                        <span></span>
                    </span>
                    {getMinPriceAfterSale.value && <span className="average-values-item">
                        <span>{averageValues.value.minPriceAfterSale[0]}</span>
                        <span>{`(${averageValues.value.minPriceAfterSale[1]}%)`}</span>
                    </span>}
                    <span className="average-values-item">
                        <span>{averageValues.value.highestPrice[0]}</span>
                        <span>{`(${averageValues.value.highestPrice[1]}x)`}</span>
                        {getMinPriceAfterSale.value && <span>{`(${averageValues.value.highestPrice[2]}x)`}</span>}
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
                        <span className="item-div-children item-name">
                            <span>{item.name}</span>
                        </span>
                        <span className="item-div-children price-before-sale">
                            <span>{item.priceBeforeSale[0]}</span>
                            <div className="tool-tip">
                                {item.priceBeforeSale[item.priceBeforeSale.length - 1].map((item2, index2) =>
                                    <span key={index2}>{`${item2[0]} | ${item2[1]} | ${item2[2]}`}</span>
                                )}
                            </div>
                        </span>
                        <span className="item-div-children min-price-during-sale">
                            <span>{item.minPriceDuringSale[0]}</span>
                            <span>{`(${item.minPriceDuringSale[1]}%)`}</span>
                            <div className="tool-tip">
                                {item.minPriceDuringSale[item.minPriceDuringSale.length - 1].map((item2, index2) =>
                                    <span key={index2}>{`${item2[0]} | ${item2[1]} | ${item2[2]}`}</span>
                                )}
                            </div>
                        </span>
                        {getMinPriceAfterSale.value && <span className="item-div-children min-price-after-sale">
                            <span>{item.minPriceAfterSale[0]}</span>
                            <span>{`(${item.minPriceAfterSale[1]}%)`}</span>
                            <div className="tool-tip">
                                {item.minPriceAfterSale[item.minPriceAfterSale.length - 1].map((item2, index2) =>
                                    <span key={index2}>{`${item2[0]} | ${item2[1]} | ${item2[2]}`}</span>
                                )}
                            </div>
                        </span>}
                        <span className="item-div-children min-price-after-sale">
                            <span>{item.highestPrice[0]}</span>
                            <span>{`(${item.highestPrice[1]}x)`}</span>
                            {getMinPriceAfterSale.value && <span>{`(${item.highestPrice[2]}x)`}</span>}
                            <div className="tool-tip tool-tip-from-right">
                                {item.highestPrice[item.highestPrice.length - 1].map((item2, index2) =>
                                    <span key={index2}>{`${item2[0]} | ${item2[1]} | ${item2[2]}`}</span>
                                )}
                            </div>
                        </span>
                    </div>)}
            </section >
        </div >
    )
}