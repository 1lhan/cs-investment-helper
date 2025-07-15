import { batch, useSignal } from '@preact/signals-react';
import { events } from '../events';
import { big, calculateDateFilterIndex, useGetRequest } from '../utils';
import CustomSelect from '../components/CustomSelect';
import HeaderWithIcon from '../components/HeaderWithIcon';
import Bubbles from '../components/Bubbles';
import LineChart from '../components/LineChart';
import ColumnChart from '../components/ColumnChart';
import Table from '../components/Table';

export default function MajorAnalysis() {
    const eventName = useSignal('Any')
    const period = useSignal('Any')
    const startDate = useSignal('')
    const endDate = useSignal('')
    const pageMsg = useSignal(null)
    const isLoading = useSignal(false)
    const lastUpdateDate = useSignal(null)
    const periodOptions = ['1 Year After Release', '2 Years After Release', 'First Month Of Sale', 'Sale Period', 'Last 3 Months', 'Last Month', 'First Month', 'First 2 Weeks', 'Before Sale Start']
    const activeFilters = useSignal(null)

    const capsuleData = useSignal(null)
    const stickersDailyMarketData = useSignal(null)
    const stickersPeriodMarketData = useSignal(null)
    const variants = useSignal(null)
    const sortState = useSignal({ field: 'id', isAscending: true })

    const fetchAndFormatData = async () => {
        const filterString = eventName.value + period.value

        if (eventName.value == 'Any' || activeFilters.value == filterString) return;

        batch(() => { pageMsg.value = null; isLoading.value = true; activeFilters.value = filterString })

        let response
        try {
            response = await useGetRequest(`get-event-items/${eventName.value}/Sticker,Capsule/Any`)
            if (!response.success) {
                activeFilters.value = null
                return pageMsg.value = response.msg || 'An error occurred while fetching data.'
            }
        }
        catch (error) {
            activeFilters.value = null
            return pageMsg.value = error.message || 'An error occurred while fetching data.'
        }

        const _variants = response.data.slice().filter(item => item.type == 'Sticker').map(item => item.variant)
        const firstItemPriceHistory = response.data.find(item => item.type == 'Sticker' && item.variant == 'Paper').items[0].priceHistory

        const dateFilterStartIndex = calculateDateFilterIndex(period.value == 'Any' ? startDate.value : null, firstItemPriceHistory, eventName.value, 'start', period.value == 'Any' ? null : period.value)
        const dateFilterEndIndex = calculateDateFilterIndex(period.value == 'Any' ? endDate.value : null, firstItemPriceHistory, eventName.value, 'end', period.value == 'Any' ? null : period.value)
        
        const _capsuleData = response.data.find(item => item.type == 'Capsule').items.slice().map(capsule => {
            let volume = capsule.priceHistory.slice(dateFilterStartIndex, dateFilterEndIndex).reduce((t, c) => +big(t).plus(c[2]), 0)
            let price = +(capsule.priceHistory.slice(dateFilterStartIndex, dateFilterEndIndex).reduce((t, c) => +big(t).plus(+big(c[1]).times(c[2])), 0) / volume).toFixed(2)
            return { name: capsule.name, price, volume }
        })

        let _stickersDailyMarketData = {}
        let _stickersPeriodMarketData = []

        for (let variantIndex in _variants) {
            let variant = _variants[variantIndex]
            let items = JSON.parse(JSON.stringify(response.data.filter(item => item.type == 'Sticker' && item.variant == variant)[0].items))

            for (let itemIndex in items) {
                let itemName = items[itemIndex].name
                let itemPriceHistory = items[itemIndex].priceHistory.slice(dateFilterStartIndex, dateFilterEndIndex)

                if (variantIndex == 0) _stickersPeriodMarketData.push({ id: +itemIndex + 1, name: itemName })
                if (itemIndex == 0) _stickersDailyMarketData[variant] = itemPriceHistory

                let volume = 0
                let avgPrice = 0
                for (let k in itemPriceHistory) {
                    let _price = itemPriceHistory[k][1]
                    let _volume = itemPriceHistory[k][2]

                    _stickersDailyMarketData[variant][k][1] += _price
                    _stickersDailyMarketData[variant][k][2] += _volume
                    avgPrice += _price * _volume
                    volume += _volume
                }
                avgPrice = +(avgPrice / volume).toFixed(2)

                let relatedStickersDataItem = _stickersPeriodMarketData[itemIndex]

                relatedStickersDataItem[`priceVariant${variantIndex}`] = avgPrice
                relatedStickersDataItem[`volumeVariant${variantIndex}`] = volume
                if (variantIndex > 0) relatedStickersDataItem[`priceRatio${variantIndex}`] = +(avgPrice / relatedStickersDataItem[`priceVariant${variantIndex - 1}`]).toFixed(2)
            }
        }

        batch(() => {
            isLoading.value = false
            variants.value = _variants
            capsuleData.value = _capsuleData
            stickersDailyMarketData.value = _stickersDailyMarketData
            stickersPeriodMarketData.value = _stickersPeriodMarketData
            sortState.value = { field: 'id', isAscending: true }
            lastUpdateDate.value = `Last Update: ${firstItemPriceHistory[firstItemPriceHistory.length - 1][0]}`
        })
    }

    const SectionContent = () => {
        if (pageMsg.value) return <span className="msg-box">{pageMsg}</span>
        if (isLoading.value) return <div className="bubbles-wrapper"><Bubbles /></div>
        if (capsuleData.value) {
            return (
                <>
                    <div className="line-charts">
                        <LineChart id="stickers-daily-price-chart" xKey={0} yKeys={[1, 2, 3, 4]}
                            data={stickersDailyMarketData.value.Paper.map((item, index) => [
                                item[0],
                                item[1].toFixed(2),
                                stickersDailyMarketData.value[variants.value[1]][index][1].toFixed(2),
                                stickersDailyMarketData.value[variants.value[2]][index][1].toFixed(2),
                                stickersDailyMarketData.value[variants.value[3]][index][1].toFixed(2)
                            ])}
                            keyNames={{ 0: 'Date', 1: variants.value[0], 2: variants.value[1], 3: variants.value[2], 4: variants.value[3] }} />
                        <LineChart id="stickers-daily-sale-amount-chart" xKey={0} yKeys={[1, 2, 3, 4]}
                            data={stickersDailyMarketData.value.Paper.map((item, index) => [
                                item[0],
                                item[2],
                                stickersDailyMarketData.value[variants.value[1]][index][2],
                                stickersDailyMarketData.value[variants.value[2]][index][2],
                                stickersDailyMarketData.value[variants.value[3]][index][2]
                            ])}
                            keyNames={{ 0: 'Date', 1: variants.value[0], 2: variants.value[1], 3: variants.value[2], 4: variants.value[3] }} />
                    </div>
                    <div className="column-chart-wrapper">
                        <ColumnChart title="Capsules Market Data" data={capsuleData} xKey={null} yKeys={['price', 'volume']} />
                        <div className="capsule-images">
                            {capsuleData.value.map((item, index) =>
                                <div key={index}>
                                    <img src={`https://api.steamapis.com/image/item/730/${item.name}`} />
                                </div>
                            )}
                        </div>
                    </div>
                    <Table data={stickersPeriodMarketData} sortState={sortState} calculate={true}
                        columns={[
                            { fields: [{ label: 'id', type: 'number', sortable: true }] },
                            { fields: [{ label: 'image', type: 'image', path: 'name' }] },
                            { fields: [{ label: `price: ${variants.value[1]}/${variants.value[0]}`, type: 'number', path: 'priceRatio1', sortable: true }] },
                            { fields: [{ label: `price: ${variants.value[2]}/${variants.value[1]}`, type: 'number', path: 'priceRatio2', sortable: true }] },
                            { fields: [{ label: `price: ${variants.value[3]}/${variants.value[2]}`, type: 'number', path: 'priceRatio3', sortable: true }] },
                            {
                                columnGroupName: 'Price', fields: [
                                    { label: variants.value[0], type: 'number', path: 'priceVariant0', sortable: true, calculate: 'addition' },
                                    { label: variants.value[1], type: 'number', path: 'priceVariant1', sortable: true, calculate: 'addition' },
                                    { label: variants.value[2], type: 'number', path: 'priceVariant2', sortable: true, calculate: 'addition' },
                                    { label: variants.value[3], type: 'number', path: 'priceVariant3', sortable: true, calculate: 'addition' }
                                ]
                            },
                            {
                                columnGroupName: 'Volume', fields: [
                                    { label: variants.value[0], type: 'number', path: 'volumeVariant0', sortable: true, calculate: 'addition' },
                                    { label: variants.value[1], type: 'number', path: 'volumeVariant1', sortable: true, calculate: 'addition' },
                                    { label: variants.value[2], type: 'number', path: 'volumeVariant2', sortable: true, calculate: 'addition' },
                                    { label: variants.value[3], type: 'number', path: 'volumeVariant3', sortable: true, calculate: 'addition' }
                                ]
                            },
                        ]}
                    />
                </>
            )
        }
        return null
    }

    return (
        <div className="major-analysis-page container">
            <header>
                <HeaderWithIcon title="Major Analysis" iconClass="fa-solid fa-magnifying-glass-chart" />
                <div className="filters">
                    <CustomSelect title="Event Name" state={eventName}
                        func={() => { if (eventName.value != 'Any' && !events.find(event => event.name == eventName.value).saleStartDate && period.value == 'Sale Period') period.value = 'Any' }}
                        options={events.filter(event => event.type == 'tournament').map(item => item.name)} />
                    <CustomSelect title="Period" state={period}
                        options={eventName.value == 'Any' ? periodOptions : events.find(event => event.name == eventName.value).saleStartDate ? periodOptions : [...periodOptions.slice(0, 2), ...periodOptions.slice(4)]} />
                    <button className="btn search-btn" onClick={() => fetchAndFormatData()}><i className="fa-solid fa-magnifying-glass" /></button>
                </div>
            </header>
            <section>
                <SectionContent />
            </section>
        </div>
    )
}