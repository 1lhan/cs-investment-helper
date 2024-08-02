import { useSelector } from "react-redux"
import { useSignal } from '@preact/signals-react'
import { dynamicTitle, usePostRequest } from "../utils"
import CustomSelect from "../components/CustomSelect"

export default function DataControlCenter({ user }) {
    const { events } = useSelector(state => state.slice)
    const selectedEvent1 = useSignal('-') // major items price changes update event name state
    const selectedEvent2 = useSignal('-') // operation items price changes update event name state
    const selectedEvent3 = useSignal('-') // major items price history data update event name state
    const outputText = useSignal('')

    dynamicTitle(window.location.pathname.slice(1).replaceAll('-', ' '))

    // Yeni majorların price history data'sı ilgili major'un sale-start tarihi belirlendikten sonra veri tabanına kaydedilir.

    const getTypeOfSticker = (sticker) => {
        let stickerTypes = ['Paper', 'Glitter', 'Holo', 'Foil', 'Gold']
        let stickerType = 'Paper'

        for (let i in stickerTypes) {
            if (sticker.includes(stickerTypes[i])) {
                stickerType = stickerTypes[i]
                break
            }
        }
        return stickerType
    }

    const convertStickers = (eventName, itemType) => {
        let eventObj = events.find(item => item.name == eventName)

        let stickerTypes;
        if (eventName == 'Stockholm-2021') {
            if (itemType == 'autographs') stickerTypes = ['Paper', 'Holo', 'Gold']
            else if (itemType == 'patches') stickerTypes = ['Paper', 'Gold']
            else stickerTypes = eventObj.stickerTypes
        }
        else stickerTypes = eventObj.stickerTypes

        let items = eventObj[itemType]

        let convertedItems = []
        let itemTypeInItemName = itemType == 'stickers' ? 'Sticker' : itemType == 'autographs' ? 'Sticker' : itemType == 'patches' ? 'Patch' : ''

        for (let i in items) {
            for (let j in stickerTypes) {
                let stickerType = stickerTypes[j]
                let item = `${itemTypeInItemName} | ${items[i]} ${stickerType != 'Paper' ? ('(' + stickerType + ') ') : ''}| ${eventName.replaceAll('-', ' ')}`
                convertedItems.push(item)
            }
        }

        return convertedItems
    }

    const convertGraffitis = (eventName) => {
        const { graffitis, graffitisColors } = events.find(item => item.name == eventName)
        let _graffitis = []

        for (let i in graffitis) {
            for (let j in graffitisColors) {
                let graffiti = graffitis[i] + ` (${graffitisColors[j]})`
                _graffitis.push(graffiti)
            }
        }

        return _graffitis
    }

    const getItemPriceHistoryArray = async (itemName, priceHistoryArrayStartDate) => {
        let today = new Date(new Date().getTime() - (1000 * 60 * 60)).toString().slice(4, 15)
        let dates = []

        // priceHistoryArrayStartDate parametresini dates array'inin ilk elemanı olarak baz alarak o tarihten bugüne kadarki bütün günleri dates array'ine pushlar. Örnek: (['Feb 10 2023', 0, 0])
        for (let i = 0; i > -1; i++) {
            let date = new Date(new Date(priceHistoryArrayStartDate).getTime() + (1000 * 60 * 60 * 24 * i)).toString().slice(4, 15)
            dates.push([date, 0, 0])

            if (date == today) break
        }

        let item = { name: itemName, prices: JSON.parse(JSON.stringify(dates)) }
        let priceHistory = await fetch(import.meta.env.VITE_REACT_APP_BACKEND_URL + '/get-price-history/' + itemName).then(res => res.json())

        if (!priceHistory || priceHistory.length == 0) return { success: false, msg: 'error 429' }
        else priceHistory = priceHistory.prices

        // priceHistory array'ini(steam get price history datası) for ile dönerek priceHistory'nin j'inci elemanının tarihi, belirlenen tarih aralığındaysa(priceHistoryArrayStartDate - today) item.prices array'inin ilgili
        // array elemanının 1. index'ine fiyat, 2. index'ine satış sayısı verisi eklenir.
        for (let j in priceHistory) {
            let index = item.prices.findIndex(item => item[0] == priceHistory[j][0].slice(0, 11))

            if (index != -1) {
                item.prices[index][1] += priceHistory[j][1] * +priceHistory[j][2]
                item.prices[index][2] += +priceHistory[j][2]
            }
        }

        item.prices.map(item => { return item[1] = +(item[1] / item[2]).toFixed(2) })

        return item.prices
    }

    const calculateMajorItemPriceChangeValues = async (itemName, eventName) => {
        let { dates } = events.find(item => item.name == eventName)

        let item = { name: itemName, priceBeforeSale: [0, []], minPriceDuringSale: [0, 0, []], highestPrice: [0, 0, 0, []] }
        let priceHistory = await getItemPriceHistoryArray(itemName, dates['release']) // itemin yayınlanma tarihinden bugüne kadarki bütün satış verilerini çeker. [[date, price, sale amount],...]
        if (priceHistory.success == false) return { success: false, msg: 'error 429' }

        let saleStartDateIndex = dates['sale-start'] == null ? priceHistory.length : priceHistory.findIndex(item => item[0] == dates['sale-start'])
        // saleStartDateIndex değeri; eğer indirimler başlamamışsa priceHistory array'inin length değerine eşitlenir ve priceBeforeSale değeri olarak son 3 günün fiyat ortalaması hesaplanır.
        let saleEndDateIndex = dates['sale-end'] == null ? priceHistory.length : priceHistory.findIndex(item => item[0] == dates['sale-end'])
        let highestPriceDateIndex = dates['highest-price'] == null ? priceHistory.length : priceHistory.findIndex(item => item[0] == dates['highest-price'])
        let minPriceAfterSaleDateIndex = dates['min-price-after-sale'] == null ? priceHistory.length : priceHistory.findIndex(item => item[0] == dates['min-price-after-sale'])

        let priceBeforeSaleArray = priceHistory.slice(0, saleStartDateIndex).filter(item => item[2] != 0).slice(-3)
        let priceBeforeSalePeriodSaleAmount = priceBeforeSaleArray.reduce((t, c) => { return t + c[2] }, 0)
        let priceBeforeSale = +(priceBeforeSaleArray.reduce((t, c) => { return t + (c[1] * c[2]) }, 0) / priceBeforeSalePeriodSaleAmount).toFixed(2)
        item.priceBeforeSale = [priceBeforeSale, priceBeforeSaleArray]

        if (dates['sale-start'] != null) {
            let minPriceDuringSaleArray = priceHistory.slice(saleStartDateIndex, saleEndDateIndex).filter(item => item[2] != 0).sort((a, b) => a[1] - b[1]).slice(0, 3)
            // itemin priceHistory array'inde indirim başlangıcından indirimin sonuna kadar olan kısmını alır, satış gerçekleşmeyen günleri filter ile siler, fiyat bakımından küçükten büyüğe sıralar, slice ile ilk 3 veriyi alır.
            // Böylece indirim döneminde itemin en düşük fiyata sahip olduğu 3 gün alınmış olur.
            let minPriceDuringSalePeriodSaleAmount = minPriceDuringSaleArray.reduce((t, c) => { return t + c[2] }, 0) // minPriceDuringSaleArray'indeki toplam satış sayısını hesaplar.
            if (minPriceDuringSalePeriodSaleAmount != 0) {
                let minPriceDuringSale = +(minPriceDuringSaleArray.reduce((t, c) => { return t + (c[1] * c[2]) }, 0) / minPriceDuringSalePeriodSaleAmount).toFixed(2)
                // minPriceDuringSaleArray'deki verilerin fiyat * satış sayısı şeklinde toplamı / toplam satış sayısı. Böylece indirim dönemindeki en düşük fiyatın gerçekleştiği 3 günün fiyat ortalaması hesaplanır.
                item.minPriceDuringSale = [minPriceDuringSale, +(((minPriceDuringSale / priceBeforeSale) - 1) * 100).toFixed(0), minPriceDuringSaleArray]
                // 1) itemin indirim döneminde en düşük fiyata sahip olduğu 3 günün fiyat ortalaması.
                // 2) itemin indirim dönemindeki en düşük fiyata sahip olduğu 3 günün ortalama fiyatının, indirim öncesi fiyatına göre yüzde kaç değiştiğini hesaplar.
                // 3) itemin indirim döneminde en düşük fiyata sahip olduğu 3 günün verilerinin olduğu array.
            }

            if (minPriceDuringSalePeriodSaleAmount != 0) {
                let highestPriceArray = priceHistory.slice(saleStartDateIndex, highestPriceDateIndex).filter(item => item[2] != 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
                let highestPricePeriodSaleAmount = highestPriceArray.reduce((t, c) => { return t + c[2] }, 0)
                let highestPrice = +(highestPriceArray.reduce((t, c) => { return t + (c[1] * c[2]) }, 0) / highestPricePeriodSaleAmount).toFixed(2)
                item.highestPrice = [highestPrice, +(highestPrice / item.minPriceDuringSale[0]).toFixed(2), 0, highestPriceArray]
            }

            if (dates['min-price-after-sale'] != false) {
                let minPriceAfterSaleArray = priceHistory.slice(saleEndDateIndex, minPriceAfterSaleDateIndex).filter(item => item[2] != 0).sort((a, b) => a[1] - b[1]).slice(0, 3)
                let minPriceAfterSalePeriodSaleAmount = minPriceAfterSaleArray.reduce((t, c) => { return t + c[2] }, 0)
                let minPriceAfterSale = +(minPriceAfterSaleArray.reduce((t, c) => { return t + (c[1] * c[2]) }, 0) / minPriceAfterSalePeriodSaleAmount).toFixed(2)
                item.minPriceAfterSale = [minPriceAfterSale, +(((minPriceAfterSale / priceBeforeSale) - 1) * 100).toFixed(0), minPriceAfterSaleArray]
                item.highestPrice[2] = +(item.highestPrice[0] / minPriceAfterSale).toFixed(2)
            }
        }

        return item
    }

    const updateMajorItemsPriceChangesData = async (eventName) => {
        if (eventName == '-') return false
        let eventObject = events.find(item => item.name == eventName)

        let majorItemsPriceChangesData = {}
        let items = {}
        eventObject.eventItems.map(item => {
            if (item == 'stickers' || item == 'autographs' || item == 'patches') {
                items[item] = convertStickers(eventName.value, item);
                majorItemsPriceChangesData[item] = {}
                majorItemsPriceChangesData[item + 'AverageValues'] = {}
            }
            else {
                items[item] = eventObject[item];
                majorItemsPriceChangesData[item] = []
                majorItemsPriceChangesData[item + 'AverageValues'] = {}
            }
        })
        eventObject.stickerTypes.map(item => {
            majorItemsPriceChangesData.stickers[item] = []
            majorItemsPriceChangesData.stickersAverageValues[item] = { priceBeforeSale: 0, minPriceDuringSale: [0, 0], minPriceAfterSale: [0, 0], highestPrice: [0, 0, 0] }

            if (eventObject.eventItems.findIndex(item => item == 'autographs') != -1) {
                majorItemsPriceChangesData.autographs[item] = []
                majorItemsPriceChangesData.autographsAverageValues[item] = { priceBeforeSale: 0, minPriceDuringSale: [0, 0], minPriceAfterSale: [0, 0], highestPrice: [0, 0, 0] }
            }
            if (eventObject.eventItems.findIndex(item => item == 'patches') != -1) {
                majorItemsPriceChangesData.patches[item] = []
                majorItemsPriceChangesData.patchesAverageValues[item] = { priceBeforeSale: 0, minPriceDuringSale: [0, 0], minPriceAfterSale: [0, 0], highestPrice: [0, 0, 0] }
            }
        })

        if (eventObject.specificItems && Object.keys(eventObject.specificItems).length > 0) {
            for (let i in Object.keys(eventObject.specificItems)) {
                items[Object.keys(eventObject.specificItems)[i]] = [...items[Object.keys(eventObject.specificItems)[i]], ...eventObject.specificItems[Object.keys(eventObject.specificItems)[i]]]
            }
        }

        outputText.value += `${eventName} items price changes data update has been started`

        // fiyat değişiklik verilerinin calculateMajorItemPriceChangeValues() fonksiyonu yardımıyla teker teker hesaplanması
        for (let i in eventObject.eventItems) {
            let itemType = eventObject.eventItems[i]
            outputText.value += `\n\n${itemType} price changes data updating...`

            for (let j in items[itemType]) {
                let item = await calculateMajorItemPriceChangeValues(items[itemType][j], eventName)
                if (item.success == false) {
                    outputText.value += `\n\nerror 429`
                    return false
                }

                if (itemType == 'stickers' || itemType == 'autographs' || itemType == 'patches') majorItemsPriceChangesData[itemType][getTypeOfSticker(item.name)].push(item)
                else majorItemsPriceChangesData[itemType].push(item)
            }

            outputText.value += `\n\n${[itemType]} price changes data has been updated.`
        }

        // event itemlarının ortalama değerlerinin hesaplanması
        for (let i in eventObject.eventItems) {
            let itemType = eventObject.eventItems[i]
            if (itemType == 'capsules' || itemType == 'souvenir-packages' || itemType == 'patch-packs') {
                let avgPriceBeforeSale =
                    +(majorItemsPriceChangesData[itemType].reduce((t, c) => { return t + c.priceBeforeSale[0] }, 0) / majorItemsPriceChangesData[itemType].length).toFixed(2)
                let avgMinPriceDuringSale =
                    +(majorItemsPriceChangesData[itemType].reduce((t, c) => { return t + c.minPriceDuringSale[0] }, 0) / majorItemsPriceChangesData[itemType].length).toFixed(2)
                let avgHighestPrice =
                    +(majorItemsPriceChangesData[itemType].reduce((t, c) => { return t + c.highestPrice[0] }, 0) / majorItemsPriceChangesData[itemType].length).toFixed(2)

                majorItemsPriceChangesData[itemType + 'AverageValues'].priceBeforeSale = avgPriceBeforeSale
                majorItemsPriceChangesData[itemType + 'AverageValues'].minPriceDuringSale = [avgMinPriceDuringSale, +(((avgMinPriceDuringSale / avgPriceBeforeSale) - 1) * 100).toFixed(0)]
                majorItemsPriceChangesData[itemType + 'AverageValues'].highestPrice = [avgHighestPrice, +(avgHighestPrice / avgMinPriceDuringSale).toFixed(0)]

                if (eventObject.dates['min-price-after-sale'] != false && eventObject.dates['sale-end'] != null) {
                    let avgMinPriceAfterSale =
                        +(majorItemsPriceChangesData[itemType].reduce((t, c) => { return t + c.minPriceAfterSale[0] }, 0) / majorItemsPriceChangesData[itemType].length).toFixed(2)
                    majorItemsPriceChangesData[itemType + 'AverageValues'].minPriceAfterSale = [avgMinPriceAfterSale, +(((avgMinPriceAfterSale / avgPriceBeforeSale) - 1) * 100).toFixed(0)]
                    majorItemsPriceChangesData[itemType + 'AverageValues'].highestPrice.push(+(avgHighestPrice / avgMinPriceAfterSale).toFixed(0))
                }
            }
            else {
                for (let j in eventObject.stickerTypes) {
                    let stickerType = eventObject.stickerTypes[j]
                    let avgPriceBeforeSale =
                        +(majorItemsPriceChangesData[itemType][stickerType].reduce((t, c) => { return t + c.priceBeforeSale[0] }, 0) / majorItemsPriceChangesData[itemType][stickerType].length).toFixed(2)
                    let avgMinPriceDuringSale =
                        +(majorItemsPriceChangesData[itemType][stickerType].reduce((t, c) => { return t + c.minPriceDuringSale[0] }, 0) / majorItemsPriceChangesData[itemType][stickerType].length).toFixed(2)
                    let avgHighestPrice =
                        +(majorItemsPriceChangesData[itemType][stickerType].reduce((t, c) => { return t + c.highestPrice[0] }, 0) / majorItemsPriceChangesData[itemType][stickerType].length).toFixed(2)

                    majorItemsPriceChangesData[itemType + 'AverageValues'][stickerType].priceBeforeSale = avgPriceBeforeSale
                    majorItemsPriceChangesData[itemType + 'AverageValues'][stickerType].minPriceDuringSale = [avgMinPriceDuringSale, +(((avgMinPriceDuringSale / avgPriceBeforeSale) - 1) * 100).toFixed(0)]
                    majorItemsPriceChangesData[itemType + 'AverageValues'][stickerType].highestPrice = [avgHighestPrice, +(avgHighestPrice / avgMinPriceDuringSale).toFixed(2)]

                    if (eventObject.dates['min-price-after-sale'] != false && eventObject.dates['sale-end'] != null) {
                        let avgMinPriceAfterSale =
                            +(majorItemsPriceChangesData[itemType][stickerType].reduce((t, c) => { return t + c.minPriceAfterSale[0] }, 0) / majorItemsPriceChangesData[itemType][stickerType].length).toFixed(2)
                        majorItemsPriceChangesData[itemType + 'AverageValues'][stickerType].minPriceAfterSale = [avgMinPriceAfterSale, +(((avgMinPriceAfterSale / avgPriceBeforeSale) - 1) * 100).toFixed(0)]
                        majorItemsPriceChangesData[itemType + 'AverageValues'][stickerType].highestPrice.push(+(avgHighestPrice / avgMinPriceAfterSale).toFixed(2))
                    }
                }
            }
        }

        let update = await usePostRequest('/update-major-items-price-changes-data', { name: eventName, lastUpdate: new Date(), ...majorItemsPriceChangesData })
        outputText.value += update.success ? `\n\n${eventName} items price changes data update finished\n\n` : `\n\n${eventName} items price changes data update failed\n\n`
    }

    const updateMajorItemsPriceHistoryData = async (eventName) => {
        let { capsules, stickerTypes, dates } = events.find(item => item.name == eventName)
        let items = { stickers: convertStickers(eventName.value, 'stickers'), capsules }
        let majorItemsPriceHistoryData = { name: eventName.value, stickers: {}, capsules: [] }
        stickerTypes.map(item => majorItemsPriceHistoryData.stickers[item] = [])

        outputText.value += `${eventName} items price history data update has been started`

        for (let i in Object.keys(items)) {
            let itemType = Object.keys(items)[i]
            outputText.value += `\n\n${itemType} price history data updating...`

            for (let j in items[itemType]) {
                let itemName = items[itemType][j]
                let priceHistory = await getItemPriceHistoryArray(itemName, itemType == 'stickers' ? dates['release'] : dates['sale-start'])
                if (priceHistory.success == false) {
                    outputText.value += `\n\nerror 429`
                    return false
                }

                if (itemType == 'stickers') {
                    let priceBeforeSaleArray = priceHistory.slice(0, priceHistory.findIndex(item => item[0] == dates['sale-start'])).filter(item => item[2] != 0).slice(-3)
                    priceHistory = priceBeforeSaleArray.concat(priceHistory.slice(priceHistory.findIndex(item => item[0] == dates['sale-start'])))
                    majorItemsPriceHistoryData[itemType][getTypeOfSticker(itemName)].push({ name: itemName, priceHistory })
                }
                else majorItemsPriceHistoryData[itemType].push({ name: itemName, priceHistory })
            }
            outputText.value += `\n\n${itemType} price history data updated.`
        }

        let post = await usePostRequest('/update-major-items-price-history-data', { lastUpdate: new Date(), ...majorItemsPriceHistoryData })
        outputText.value += post.success ? `\n\n${eventName} items price history data has been updated\n\n` : `\n\n${eventName} items price history data update has been failed\n\n`
    }

    const calculateOperationItemPriceChangesValues = async (itemName, eventName) => {
        let { dates } = events.find(item => item.name == eventName)

        let item = { name: itemName, minPriceDuringOperation: [0, []], highestPrice: [0, 0, []] }
        let priceHistory = await getItemPriceHistoryArray(itemName, dates['release'])
        if (priceHistory.success == false) return { success: false, msg: 'error 429' }

        let operationEndDateIndex = dates['end'] == null ? priceHistory.length : priceHistory.findIndex(item => item[0] == dates['end'])
        let highestPriceIndex = dates['highest-price'] == null ? priceHistory.length : priceHistory.findIndex(item => item[0] == dates['highest-price'])

        let minPriceDuringOperationArray = priceHistory.slice(0, operationEndDateIndex).filter(item => item[2] != 0).sort((a, b) => a[1] - b[1]).slice(0, 3)
        let minPriceDuringOperationPeriodSaleAmount = minPriceDuringOperationArray.reduce((t, c) => { return t + c[2] }, 0)
        let minPriceDuringOperation = +(minPriceDuringOperationArray.reduce((t, c) => { return t + (c[1] * c[2]) }, 0) / minPriceDuringOperationPeriodSaleAmount).toFixed(2)
        item.minPriceDuringOperation = [minPriceDuringOperation, minPriceDuringOperationArray]

        let highestPriceArray = priceHistory.slice(operationEndDateIndex, highestPriceIndex).filter(item => item[2] != 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
        let highestPricePeriodSaleAmount = highestPriceArray.reduce((t, c) => { return t + c[2] }, 0)
        let highestPrice = +(highestPriceArray.reduce((t, c) => { return t + (c[1] * c[2]) }, 0) / highestPricePeriodSaleAmount).toFixed(2)
        item.highestPrice = [highestPrice, +(highestPrice / minPriceDuringOperation).toFixed(2), highestPriceArray]

        return item
    }

    const updateOperationItemsPriceChangesData = async (eventName) => {
        if (eventName == '-') return false

        let eventObject = events.find(item => item.name == eventName)
        let operationItemsPriceChangesData = { name: eventName.value, lastUpdate: new Date() }
        let items = {}
        eventObject.eventItems.map(item => { operationItemsPriceChangesData[item] = []; operationItemsPriceChangesData[item + 'AverageValues'] = {}; items[item] = eventObject[item] })
        if (eventObject.eventItems.includes('graffitis')) items.graffitis = convertGraffitis(eventName)

        outputText.value += `${eventName} items price changes data update has been started`

        for (let i in eventObject.eventItems) {
            let itemType = eventObject.eventItems[i]
            outputText.value += `\n\n${itemType} price changes data updating...`

            for (let j in items[itemType]) {
                let itemName = items[itemType][j]
                let item = await calculateOperationItemPriceChangesValues(itemName, eventName)
                if (priceHistory.success == false) {
                    outputText.value += `\n\nerror 429`
                    return false
                }
                operationItemsPriceChangesData[itemType].push(item)
            }
            outputText.value += `\n\n${itemType} price changes data updated.`
        }

        for (let i in eventObject.eventItems) {
            let itemType = eventObject.eventItems[i]

            let minPriceDuringOperation = +(operationItemsPriceChangesData[itemType].reduce((t, c) => { return t + c.minPriceDuringOperation[0] }, 0) / operationItemsPriceChangesData[itemType].length).toFixed(2)
            let highestPrice = +(operationItemsPriceChangesData[itemType].reduce((t, c) => { return t + c.highestPrice[0] }, 0) / operationItemsPriceChangesData[itemType].length).toFixed(2)

            operationItemsPriceChangesData[itemType + 'AverageValues'].minPriceDuringOperation = minPriceDuringOperation
            operationItemsPriceChangesData[itemType + 'AverageValues'].highestPrice = [highestPrice, +(highestPrice / minPriceDuringOperation).toFixed(2)]
        }

        let post = await usePostRequest('/update-operation-items-price-changes-data', operationItemsPriceChangesData)
        outputText.value += post.success ? `\n\n${eventName} items price changes data has been updated\n\n` : `\n\n${eventName} items price changes data update failed`
    }

    return (
        user.value.accountInformations.accountType == 'admin' &&
        <div className="data-control-center-page container">
            <div className="top-div">
                <h2><i className="fa-solid fa-database" />Data Control Center</h2>
            </div>
            <section>
                <div className="settings-div">
                    <div className="settings-div-item">
                        <span>Major Items Price Changes Data</span>
                        <CustomSelect id='selectedEvent1' title={'Choose Tournament'} state={selectedEvent1} options={events.filter(item => item.eventType == 'tournament').map(item => { return item.name })} width={'11rem'} />
                        <button className="btn" onClick={() => updateMajorItemsPriceChangesData(selectedEvent1)}>Update</button>
                    </div>
                    <hr />
                    <div className="settings-div-item">
                        <span>Operation Items Price Changes Data</span>
                        <CustomSelect id='selectedEvent2' title={'Choose Operation'} state={selectedEvent2} options={events.filter(item => item.eventType == 'operation').map(item => { return item.name })} width={'14rem'} />
                        <button className="btn" onClick={() => updateOperationItemsPriceChangesData(selectedEvent2)}>Update</button>
                    </div>
                    <hr />
                    <div className="settings-div-item">
                        <span>Major Items Price History Data</span>
                        <CustomSelect id='selectedEvent3' title={'Choose Tournament'} state={selectedEvent3} options={events.filter(item => item.eventType == 'tournament').map(item => { return item.name })} width={'11rem'} />
                        <button className="btn" onClick={() => updateMajorItemsPriceHistoryData(selectedEvent3)}>Update</button>
                    </div>
                </div>
                <div className="output-div">
                    <h4 className="output-div-header"><i className="fa-solid fa-terminal" />Output</h4>
                    <span className="output-text">{outputText}</span>
                </div>
            </section>
        </div>
    )
}