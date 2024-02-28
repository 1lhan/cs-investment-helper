import { useSelector } from "react-redux"
import CustomSelect from "../components/CustomSelect"
import { batch, useSignal } from "@preact/signals-react"
import Bubbles from "../components/Bubbles"
import DoubleValueColumnChart from "../components/DoubleValueColumnChart"
import MultipleDataSetLineChart from "../components/MultipleDataSetLineChart"
import { dynamicTitle } from "../utils"

export default function MajorAnalysisCenter() {
    const { events, blue } = useSelector(state => state.slice)
    const eventName = useSignal('-')
    const period = useSignal('-')

    const isLoading = useSignal(null)
    const sortNumber = useSignal(-1)

    const stickerPriceChanges = useSignal(false) // object
    const stickerCompareSectionData = useSignal(false) // array
    const capsuleData = useSignal(false) // array
    const totalPriceAndSaleAmountData = useSignal(false) // object
    
    dynamicTitle(window.location.pathname.slice(1).replaceAll('-',' '))

    const dataHandler = async () => {
        if (eventName == '-' || period == '-') return false
        batch(() => {
            isLoading.value = true
            totalPriceAndSaleAmountData.value = false
            capsuleData.value = false
            stickerCompareSectionData.value = false
            stickerPriceChanges.value = false
        })

        let data = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/get-major-items-price-history-data/${eventName.value}`).then(res => res.json())
        if (!data.success || !data) return false
        else sortNumber.value = -1

        const { dates } = events.find(item => item.name == eventName)
        let _stickerCompareSectionData = []
        let _totalPriceAndSaleAmountData = {}
        let _capsuleData = []
        let _stickerPriceChanges = {}

        let sliceIndex1 = period == 'Last 30 Days' ? -30 : period == 'Last 60 Days' ? -60 : 3
        let sliceIndex2 = period == 'Sale Period' ? data.stickers.Paper[0].priceHistory.findIndex(item => item[0] == dates['sale-end']) : data.stickers.Paper[0].priceHistory.length

        // _stickerCompareSectionData ve _totalPriceAndSaleAmountData hesaplanması
        for (let i in Object.keys(data.stickers)) {
            let stickerType = Object.keys(data.stickers)[i]

            for (let j in data.stickers[stickerType]) {
                let sticker = data.stickers[stickerType][j]
                let priceBeforeSale = +(sticker.priceHistory.slice(0, 3).reduce((t, c) => { return t + (c[1] * c[2]) }, 0) / sticker.priceHistory.slice(0, 3).reduce((t, c) => { return t + c[2] }, 0)).toFixed(2)
                let priceHistoryArray = sticker.priceHistory.slice(sliceIndex1, sliceIndex2)

                // stickerType olarak paper(i == 0) seçili olduğunda her yeni sticker(j)'a geçildiğinde _stickerCompareSectionData'a yeni eleman pushlar
                if (i == 0) _stickerCompareSectionData.push({ name: sticker.name, compare: [0, 0, 0], prices: [0, 0, 0, 0], saleAmounts: [0, 0, 0, 0] })
                // sticker(j)'dan bağımsız olarak stickerType(i) her değiştiğinde _totalPriceAndSaleAmountData'a key'i stickerType, value'si aşağıdaki gibi olan bir key, value ikilisi ekler
                // aynı şekilde stickerType(i) her değiştiğinde _stickerPriceChanges'e key'i stickerType, value'si [] olan bir key, value ikilisi ekler
                if (j == 0) {
                    _totalPriceAndSaleAmountData[stickerType] = priceHistoryArray.slice().map(item => { return { date: item[0], price: 0, saleAmount: 0 } })
                    _stickerPriceChanges[stickerType] = []
                }

                // _stickerPriceChanges değerlerinin hesaplanması
                _stickerPriceChanges[stickerType].push({
                    name: sticker.name, priceBeforeSale,
                    difference: +(((priceHistoryArray[priceHistoryArray.length - 1][1] / priceBeforeSale) - 1) * 100).toFixed(0), last24hAvgPrice: priceHistoryArray[priceHistoryArray.length - 1][1]
                })

                // data'dan gelen sticker'ın priceHistoryArray'indeki değerlerinin ilgili yerlere eklenmesi
                for (let k in priceHistoryArray) {
                    _totalPriceAndSaleAmountData[stickerType][k].price += priceHistoryArray[k][1]
                    _totalPriceAndSaleAmountData[stickerType][k].saleAmount += priceHistoryArray[k][2]

                    _stickerCompareSectionData[j].prices[i] += (priceHistoryArray[k][1] * priceHistoryArray[k][2])
                    _stickerCompareSectionData[j].saleAmounts[i] += priceHistoryArray[k][2]
                }

                // data içerisindeki belirli bir sticker türündeki bütün stickerların price ve saleAmount dataları _totalPriceAndSaleAmountData içerisine kaydedildikten sonra _totalPriceAndSaleAmountData'ın o sticker türündeki
                // array elemanlarının hepsinin price'ı noktadan sonra 2 basamak olacak şekilde düzenlenir
                if (j == data.stickers[stickerType].length - 1) _totalPriceAndSaleAmountData[stickerType].map(item => item.price = +item.price.toFixed(2))
            }
            _stickerPriceChanges[stickerType].sort((a, b) => a.difference - b.difference) // _stickerPriceChanges'ın verileri her stickerType(i)'ın son sticker'inden sonra difference değerine göre küçükten büyüğe sıralanır 
        }

        // _stickerCompareSectionData'nın her bir elemanının compare verilerinin hesaplanması ve price değerlerinin noktadan sonra 2 basamak olacak şekilde düzenlenmesi
        _stickerCompareSectionData.map(item => {
            item.prices[0] = +(item.prices[0] / item.saleAmounts[0]).toFixed(2)
            item.prices[1] = +(item.prices[1] / item.saleAmounts[1]).toFixed(2)
            item.prices[2] = +(item.prices[2] / item.saleAmounts[2]).toFixed(2)
            item.prices[3] = +(item.prices[3] / item.saleAmounts[3]).toFixed(2)
            item.compare[0] = +(item.prices[1] / item.prices[0]).toFixed(2)
            item.compare[1] = +(item.prices[2] / item.prices[1]).toFixed(2)
            item.compare[2] = +(item.prices[3] / item.prices[2]).toFixed(2)
        })

        // capsule verilerinin hesaplanması
        for (let i in data.capsules) {
            let priceHistory = data.capsules[i].priceHistory.slice(sliceIndex1, sliceIndex2)

            let saleAmount = priceHistory.reduce((t, c) => { return t + c[2] }, 0)
            let _price = priceHistory.reduce((t, c) => { return t + (c[1] * c[2]) }, 0)
            _capsuleData.push({ name: data.capsules[i].name, price: +(_price / saleAmount).toFixed(3), 'sale-amount': saleAmount })
        }

        batch(() => {
            totalPriceAndSaleAmountData.value = _totalPriceAndSaleAmountData
            capsuleData.value = _capsuleData
            stickerCompareSectionData.value = _stickerCompareSectionData
            stickerPriceChanges.value = _stickerPriceChanges
            isLoading.value = false
        })
    }

    const StickerPriceChangesSection = () => {
        return (
            <div className="sticker-price-changes-section">
                <h3>Sticker Price Changes</h3>
                {Object.keys(stickerPriceChanges.value).map((stickerType, index) =>
                    <div className="sticker-price-changes-section-item" key={index}>
                        <h4 className="title">{stickerType}</h4>
                        <div className="sticker-price-changes-section-field-names">
                            <span className="image">Img</span>
                            <span className="field-names-item">Price Before Sale</span>
                            <span className="field-names-item">Difference</span>
                            <span className="field-names-item">Last 24h Avg Price</span>
                        </div>
                        {stickerPriceChanges.value[stickerType].map((sticker, stickerIndex) =>
                            <div className="sticker-div" key={stickerIndex}>
                                <img className="image" src={'https://api.steamapis.com/image/item/730/' + sticker.name} />
                                <span className="sticker-div-item">{sticker.priceBeforeSale}</span>
                                <span className="sticker-div-item">{sticker.difference + '%'}</span>
                                <span className="sticker-div-item">{sticker.last24hAvgPrice}</span>
                            </div>

                        )}
                    </div>
                )}
            </div>
        )
    }

    const StickerCompareSection = () => {
        const stickerCompareSectionDataSorter = () => {
            let _data = stickerCompareSectionData.value.slice()

            if (sortNumber == 1 || sortNumber == 2) _data.sort((a, b) => b.compare[0] - a.compare[0])
            else if (sortNumber == 3 || sortNumber == 4) _data.sort((a, b) => b.compare[1] - a.compare[1])
            else if (sortNumber == 5 || sortNumber == 6) _data.sort((a, b) => b.compare[2] - a.compare[2])
            else if (sortNumber == 7 || sortNumber == 8) _data.sort((a, b) => b.prices[0] - a.prices[0])
            else if (sortNumber == 9 || sortNumber == 10) _data.sort((a, b) => b.prices[1] - a.prices[1])
            else if (sortNumber == 11 || sortNumber == 12) _data.sort((a, b) => b.prices[2] - a.prices[2])
            else if (sortNumber == 13 || sortNumber == 14) _data.sort((a, b) => b.prices[3] - a.prices[3])
            else if (sortNumber == 15 || sortNumber == 16) _data.sort((a, b) => b.saleAmounts[0] - a.saleAmounts[0])
            else if (sortNumber == 17 || sortNumber == 18) _data.sort((a, b) => b.saleAmounts[1] - a.saleAmounts[1])
            else if (sortNumber == 19 || sortNumber == 20) _data.sort((a, b) => b.saleAmounts[2] - a.saleAmounts[2])
            else if (sortNumber == 21 || sortNumber == 22) _data.sort((a, b) => b.saleAmounts[3] - a.saleAmounts[3])

            if (sortNumber % 2 == 1) _data = _data.reverse()
            stickerCompareSectionData.value = _data
        }

        return (
            <div className="sticker-compare-section-wrapper">
                <h3>Sticker Compare Section</h3>
                <div className="sticker-compare-section">
                    <div className="sticker-compare-section-field-names">
                        <label className="image">Img</label>
                        <span style={{ color: sortNumber == 1 || sortNumber == 2 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 2 ? 1 : 2; stickerCompareSectionDataSorter() }}>
                            {Object.keys(stickerPriceChanges.value)[1] + '/' + Object.keys(stickerPriceChanges.value)[0]}
                        </span>
                        <span style={{ color: sortNumber == 3 || sortNumber == 4 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 4 ? 3 : 4; stickerCompareSectionDataSorter() }}>
                            {Object.keys(stickerPriceChanges.value)[2] + '/' + Object.keys(stickerPriceChanges.value)[1]}
                        </span>
                        <span style={{ color: sortNumber == 5 || sortNumber == 6 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 6 ? 5 : 6; stickerCompareSectionDataSorter() }}>
                            {Object.keys(stickerPriceChanges.value)[3] + '/' + Object.keys(stickerPriceChanges.value)[2]}
                        </span>
                        <span style={{ color: sortNumber == 7 || sortNumber == 8 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 8 ? 7 : 8; stickerCompareSectionDataSorter() }}>
                            {'Price: ' + Object.keys(stickerPriceChanges.value)[0]}
                        </span>
                        <span style={{ color: sortNumber == 9 || sortNumber == 10 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 10 ? 9 : 10; stickerCompareSectionDataSorter() }}>
                            {'Price: ' + Object.keys(stickerPriceChanges.value)[1]}
                        </span>
                        <span style={{ color: sortNumber == 11 || sortNumber == 12 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 12 ? 11 : 12; stickerCompareSectionDataSorter() }}>
                            {'Price: ' + Object.keys(stickerPriceChanges.value)[2]}
                        </span>
                        <span style={{ color: sortNumber == 13 || sortNumber == 14 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 14 ? 13 : 14; stickerCompareSectionDataSorter() }}>
                            {'Price: ' + Object.keys(stickerPriceChanges.value)[3]}
                        </span>
                        <span style={{ color: sortNumber == 15 || sortNumber == 16 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 16 ? 15 : 16; stickerCompareSectionDataSorter() }}>
                            {'Sale Amount: ' + Object.keys(stickerPriceChanges.value)[0]}
                        </span>
                        <span style={{ color: sortNumber == 17 || sortNumber == 18 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 18 ? 17 : 18; stickerCompareSectionDataSorter() }}>
                            {'Sale Amount: ' + Object.keys(stickerPriceChanges.value)[1]}
                        </span>
                        <span style={{ color: sortNumber == 19 || sortNumber == 20 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 20 ? 19 : 20; stickerCompareSectionDataSorter() }}>
                            {'Sale Amount: ' + Object.keys(stickerPriceChanges.value)[2]}
                        </span>
                        <span style={{ color: sortNumber == 21 || sortNumber == 22 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 22 ? 21 : 22; stickerCompareSectionDataSorter() }}>
                            {'Sale Amount: ' + Object.keys(stickerPriceChanges.value)[3]}
                        </span>
                    </div>
                    {stickerCompareSectionData.value.map((item, index) =>
                        <div className="sticker-compare-section-item" key={index}>
                            <img className="image" src={'https://api.steamapis.com/image/item/730/' + item.name} />
                            <span>{item.compare[0] + 'x'}</span>
                            <span>{item.compare[1] + 'x'}</span>
                            <span>{item.compare[2] + 'x'}</span>
                            <span>{item.prices[0]}</span>
                            <span>{item.prices[1]}</span>
                            <span>{item.prices[2]}</span>
                            <span>{item.prices[3]}</span>
                            <span>{item.saleAmounts[0]}</span>
                            <span>{item.saleAmounts[1]}</span>
                            <span>{item.saleAmounts[2]}</span>
                            <span>{item.saleAmounts[3]}</span>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const CapsulesDataSection = () => {
        return (
            <div className="capsules-data-section">
                <div className="double-value-column-chart-wrapper">
                    <DoubleValueColumnChart title={'Capsules Sale Amount And Price'} valueKeys={['sale-amount', 'price']} data={capsuleData.value} toolTipKeys={['name', 'sale-amount', 'price']} />
                </div>
                <div className="capsule-images">
                    {capsuleData.value.map((capsule, index) =>
                        <div className="image-wrapper" key={index}>
                            <img className="image" src={'https://api.steamapis.com/image/item/730/' + capsule.name} />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="major-analysis-center-page container">
            <div className="top-div">
                <h2><i className="fa-solid fa-magnifying-glass-chart" />Major Analysis Center</h2>
                <div className="get-data-settings">
                    <CustomSelect id='eventName' title={'Choose Tournament'} state={eventName} width='10rem' options={events.filter(item => item.eventType == 'tournament').map(item => { return item.name })} />
                    <CustomSelect id='periods' title={'Choose Period'} state={period} width='10rem' options={['Sale Period', 'Last 30 Days', 'Last 60 Days']} />
                    <button className="btn" onClick={() => dataHandler()}>Get Data</button>
                </div>
            </div>
            <section>
                {isLoading.value && <div className="bubbles-wrapper"><Bubbles /></div>}
                {totalPriceAndSaleAmountData.value && <div style={{ width: '100%' }}>
                    <MultipleDataSetLineChart data={[totalPriceAndSaleAmountData.value[Object.keys(totalPriceAndSaleAmountData.value)[0]],
                    totalPriceAndSaleAmountData.value[Object.keys(totalPriceAndSaleAmountData.value)[1]],
                    totalPriceAndSaleAmountData.value[Object.keys(totalPriceAndSaleAmountData.value)[2]],
                    totalPriceAndSaleAmountData.value[Object.keys(totalPriceAndSaleAmountData.value)[3]]]}
                        headerText={'Stickers Price Chart'} valueKey={'price'} horizontalAreaKey={'date'} dataSliceOptions={[]} colors={['#4B69FF', '#883AAC', '#D32A9E', '#DE352D']}
                        toolTipKeys={Object.keys(totalPriceAndSaleAmountData.value)} />
                </div>}
                {totalPriceAndSaleAmountData.value && <div style={{ width: '100%' }}>
                    <MultipleDataSetLineChart data={[totalPriceAndSaleAmountData.value[Object.keys(totalPriceAndSaleAmountData.value)[0]],
                    totalPriceAndSaleAmountData.value[Object.keys(totalPriceAndSaleAmountData.value)[1]],
                    totalPriceAndSaleAmountData.value[Object.keys(totalPriceAndSaleAmountData.value)[2]],
                    totalPriceAndSaleAmountData.value[Object.keys(totalPriceAndSaleAmountData.value)[3]]]}
                        headerText={'Stickers Sale Amount Chart'} valueKey={'saleAmount'} horizontalAreaKey={'date'} dataSliceOptions={[]} colors={['#4B69FF', '#883AAC', '#D32A9E', '#DE352D']}
                        toolTipKeys={Object.keys(totalPriceAndSaleAmountData.value)} />
                </div>}
                {capsuleData.value && <CapsulesDataSection />}
                {stickerCompareSectionData.value && <StickerCompareSection />}
                {stickerPriceChanges.value && <StickerPriceChangesSection />}
            </section>
        </div >
    )
}