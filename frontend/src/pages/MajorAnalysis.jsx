import { batch, useSignal } from '@preact/signals-react'
import { events } from '../events'
import CustomSelect from '../components/CustomSelect'
import ColumnChart from '../components/ColumnChart'
import Table from '../components/Table'
import LineChart from '../components/LineChart'

export default function MajorAnalysis() {
    const eventName = useSignal('Any')
    const period = useSignal('Any')
    const startDate = useSignal('')
    const endDate = useSignal('')
    const pageMsg = useSignal(null)

    const capsulesData = useSignal(null)
    const variants = useSignal(null)
    const stickersDailyMarketData = useSignal(null)
    const stickersPeriodMarketData = useSignal(null)
    const dataLastUpdateDate = useSignal(null)

    const sortValue = useSignal({ name: 'id', value: true })

    const fetchAndFormatData = async () => {
        let response, responseData;

        try {
            response = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/get-tournament-items/${eventName.value}/sticker,capsule/Any`)
            if (!response.ok) throw new Error('Failed to fetch data.')

            responseData = await response.json()
            if (!responseData.success) return pageMsg.value = response.msg

            responseData = responseData.data
        }
        catch (error) { return pageMsg.value = error.message || 'An error occurred while fetching data.' }

        let firstItemPriceHistory = responseData.find(item => item.type == 'sticker' && item.variant == 'Paper').items[0].priceHistory

        let startDateIndexInItemPriceHistory = firstItemPriceHistory.findIndex(item => item[0] == new Date(startDate.value).toDateString().slice(4))
        let endDateIndexInItemPriceHistory = firstItemPriceHistory.findIndex(item => item[0] == new Date(endDate.value).toDateString().slice(4))
        let startDateIndex = startDateIndexInItemPriceHistory == -1 ? 0 : startDateIndexInItemPriceHistory
        let endDateIndex = endDateIndexInItemPriceHistory == -1 ? firstItemPriceHistory.length : endDateIndexInItemPriceHistory + 1

        const _capsulesData = responseData.find(item => item.type == 'capsule').items.slice().map(capsule => {
            let volume = capsule.priceHistory.slice(startDateIndex, endDateIndex).reduce((t, c) => { return t + c[2] }, 0)
            let price = +(capsule.priceHistory.slice(startDateIndex, endDateIndex).reduce((t, c) => { return t + (c[1] * c[2]) }, 0) / volume).toFixed(2)
            return { name: capsule.name, price, volume }
        })

        let _stickersDailyMarketData = {}
        let _stickersPeriodMarketData = []

        const _variants = responseData.filter(item => item.type == 'sticker').map(item => { return item.variant })

        for (let variantIndex in _variants) {
            let variant = _variants[variantIndex]
            let items = JSON.parse(JSON.stringify(responseData.filter(item => item.type == 'sticker' && item.variant == variant)[0].items))

            for (let itemIndex in items) {
                let itemName = items[itemIndex].name
                let itemPriceHistory = items[itemIndex].priceHistory.slice(startDateIndex, endDateIndex)

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
            pageMsg.value = null
            capsulesData.value = _capsulesData
            variants.value = _variants
            stickersDailyMarketData.value = _stickersDailyMarketData
            stickersPeriodMarketData.value = _stickersPeriodMarketData
            sortValue.value = { name: 'id', value: true }
            dataLastUpdateDate.value = `Last Update: ${responseData[0].items[0].priceHistory[responseData[0].items[0].priceHistory.length - 1][0]}`
        })
    }

    const Section = () => {
        if(pageMsg.value) return <span className="page-msg-box">{pageMsg.value}</span>
        if (!stickersDailyMarketData.value) return null;

        return (
            <section>
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
                    <ColumnChart title="Capsules Market Data" data={capsulesData} xKey={null} yKeys={['price', 'volume']} />
                    <div className="capsule-images">
                        {capsulesData.value.map((item, index) =>
                            <div key={index}>
                                <img src={`https://api.steamapis.com/image/item/730/${item.name}`} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="table-wrapper">
                    <Table data={stickersPeriodMarketData} sortState={sortValue} calculate={true}
                        fields={[
                            { fields: [{ name: 'id', type: 'number', sortable: true }] },
                            { fields: [{ name: 'image', type: 'image', path: 'name' }] },
                            { fields: [{ name: `price: ${variants.value[1]}/${variants.value[0]}`, type: 'number', path: 'priceRatio1', sortable: true }] },
                            { fields: [{ name: `price: ${variants.value[2]}/${variants.value[1]}`, type: 'number', path: 'priceRatio2', sortable: true }] },
                            { fields: [{ name: `price: ${variants.value[3]}/${variants.value[2]}`, type: 'number', path: 'priceRatio3', sortable: true }] },
                            {
                                groupName: 'Price', fields: [
                                    { name: variants.value[0], type: 'number', path: 'priceVariant0', sortable: true, calculate: 'addition' },
                                    { name: variants.value[1], type: 'number', path: 'priceVariant1', sortable: true, calculate: 'addition' },
                                    { name: variants.value[2], type: 'number', path: 'priceVariant2', sortable: true, calculate: 'addition' },
                                    { name: variants.value[3], type: 'number', path: 'priceVariant3', sortable: true, calculate: 'addition' }
                                ]
                            },
                            {
                                groupName: 'Volume', fields: [
                                    { name: variants.value[0], type: 'number', path: 'volumeVariant0', sortable: true, calculate: 'addition' },
                                    { name: variants.value[1], type: 'number', path: 'volumeVariant1', sortable: true, calculate: 'addition' },
                                    { name: variants.value[2], type: 'number', path: 'volumeVariant2', sortable: true, calculate: 'addition' },
                                    { name: variants.value[3], type: 'number', path: 'volumeVariant3', sortable: true, calculate: 'addition' }
                                ]
                            },
                        ]}
                    />
                </div>
            </section>
        )
    }

    const Filters = () => {
        return (
            <div className="filters">
                <span className="data-last-update-date">{dataLastUpdateDate}</span>
                <CustomSelect title="Event Name" state={eventName} options={events.filter(event => event.type == 'tournament').map(event => { return event.name })}
                    func={() => batch(() => {
                        period.value = 'Any'
                        startDate.value = ''
                        endDate.value = ''
                    })} />
                <CustomSelect id="period" title="Period" state={period} options={['Sale Period', 'Last 3 Months', 'Last Month']}
                    func={() => {
                        if (eventName.value != 'Any') {
                            batch(() => {
                                startDate.value = period.value == 'Sale Period' ? events.find(event => event.name == eventName.value).saleStartDate :
                                    period.value == 'Last 3 Months' ? new Date(new Date().setMonth(new Date().getMonth() - 3)) :
                                        period.value == 'Last Month' ? new Date(new Date().setMonth(new Date().getMonth() - 1)) : startDate.value
                                endDate.value = period.value == 'Sale Period' ? events.find(event => event.name == eventName.value).endDate : ''
                            })
                        }
                    }} />
                <div className="date-filters">
                    <input type="date" id="startDateInput"
                        min={eventName.value != 'Any' ? events.find(item => item.name == eventName.value).releaseDate.toISOString().split('T')[0] : ''}
                        max={new Date().toISOString().split('T')[0]}
                        value={startDate.value && new Date(startDate.value).toISOString().split('T')[0]}
                        onChange={(e) => {
                            startDate.value = e.target.value;
                            if (new Date(startDate.value) > new Date(endDate.value)) { document.querySelector('#endDateInput').value = ''; endDate.value = '' }
                        }}
                    />
                    <span>-</span>
                    <input type="date" id="endDateInput"
                        min={eventName.value != 'Any' ? events.find(item => item.name == eventName.value).releaseDate.toISOString().split('T')[0] : ''}
                        max={new Date().toISOString().split('T')[0]}
                        value={endDate.value && new Date(endDate.value).toISOString().split('T')[0]}
                        onChange={(e) => {
                            endDate.value = e.target.value;
                            if (new Date(startDate.value) > new Date(endDate.value)) { document.querySelector('#startDateInput').value = ''; startDate.value = '' }
                        }}
                    />
                </div>
                <button className="btn" onClick={() => fetchAndFormatData()} disabled={eventName.value == 'Any'}><i className="fa-solid fa-magnifying-glass" /></button>
            </div>
        )
    }

    return (
        <div className="major-analysis-page container">
            <header>
                <div className="page-name">
                    <div className="icon-wrapper">
                        <i className="fa-solid fa-magnifying-glass-chart" />
                    </div>
                    <span>Major Analysis</span>
                </div>
                <Filters />
            </header>
            <Section />
        </div>
    )
}