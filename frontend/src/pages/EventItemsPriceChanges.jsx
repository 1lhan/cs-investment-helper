import { batch, useComputed, useSignal } from '@preact/signals-react'
import { events } from '../events'
import CustomSelect from '../components/CustomSelect'
import Table from '../components/Table'
import Loading from '../components/Loading'

export default function EventItemsPriceChanges() {
    const eventName = useSignal('Any')
    const type = useSignal('Any')
    const variant = useSignal('Any')
    const period = useSignal('Any')
    const startDate = useSignal('')
    const endDate = useSignal('')

    const sortValue = useSignal({ name: 'id', value: true })
    const isLoading = useSignal(false)
    const items = useSignal(false)
    const currenDataFilterString = useSignal(null)
    const pageMsg = useSignal(null)

    const tableFields = useSignal([])

    const fetchAndFormatData = async () => {
        const filterString = eventName.value + type.value + variant.value + startDate.value + endDate.value
        if ((eventName.value == 'Any' && type.value == 'Any' && variant.value == 'Any') || currenDataFilterString.value == filterString) return;

        batch(() => {
            isLoading.value = true
            tableFields.value = [
                { fields: [{ name: 'id', type: 'number', sortable: true }] },
                { fields: [{ name: 'image', type: 'image', path: 'name' }] },
                { fields: [{ name: 'name', type: 'text', sortable: true }] },
                { toolTip: { type: 'array', path: 'minPriceArray' }, fields: [{ name: 'minPrice', type: 'number', sortable: true, calculate: 'addition' }] },
                {
                    toolTip: { type: 'array', path: 'highestPriceArray' },
                    fields: [{ name: 'highestPrice', type: 'number', sortable: true, calculate: 'addition' }, { name: '(x)', type: 'number', path: 'highestPriceDiff2', template: '(_rx)', sortable: true }]
                },
                {
                    toolTip: { type: 'array', path: 'currentPriceArray' },
                    fields: [
                        { name: 'currentPrice', type: 'number', sortable: true, calculate: 'addition' },
                        { name: '(x)', type: 'number', path: 'currentPriceAndMinPriceDiff', template: '(_rx)', sortable: true },
                        { name: '(%)', type: 'number', path: 'currentPriceHighestPriceDiff', template: '(_r%)', sortable: true }
                    ]
                }
            ]
        })

        let _data

        try {
            let response = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/get-tournament-items/${eventName.value}/${type.value}/${variant.value}`)
            if (!response.ok) throw new Error('Failed to fetch data.')

            const responsedData = await response.json()
            if (!responsedData.success) return batch(() => { pageMsg.value = response.msg; isLoading.value = false })

            _data = responsedData.data
        }
        catch (error) { return pageMsg.value = error.message || 'An error occurred while fetching sticker application numbers.' }

        let processedItems = []
        let event;

        JSON.parse(JSON.stringify(_data)).map(dataItem => {
            let { eventName, items } = dataItem
            event = events.find(item => item.name == eventName)

            let saleStartIndex = event.saleStartDate ? items[0].priceHistory.findIndex(item => item[0] == new Date(event.saleStartDate).toDateString().slice(4)) : 0
            let saleEndIndex = event.endDate ? items[0].priceHistory.findIndex(item => item[0] == new Date(event.endDate).toDateString().slice(4)) : items[0].priceHistory.length - 1

            // if startDate.value == '', returns -1 || if data is not up to date, it may not be able to find the index and returns -1. Same applies to endDateIndex
            let startDateIndex = items[0].priceHistory.findIndex(item => item[0] == new Date(startDate.value).toDateString().slice(4))
            let endDateIndex = items[0].priceHistory.findIndex(item => item[0] == new Date(endDate.value).toDateString().slice(4))

            let dateFilterStartIndex = startDateIndex != -1 ? startDateIndex : event.saleStartDate ? saleStartIndex : 0
            let dateFilterEndIndex = endDateIndex != -1 ? endDateIndex + 1 : items[0].priceHistory.length

            const getAvgPriceOfArray = (arr) => +(arr.reduce((t, c) => { return t + (c[1] * c[2]) }, 0) / arr.reduce((t, c) => { return t + c[2] }, 0)).toFixed(2)
            const calculateRatio = (num1, num2) => +(((num1 / num2) - 1) * 100).toFixed(0) // input 1.95, 7.04 output: -72

            let _processedItems = items.map((item, itemIndex) => {
                // item.priceHistory = [['Mar 21 2024', 6.041, 1269], ['Mar 22 2024', 6.554, 511], ...] (date, price, volume)
                let currentPriceArray = item.priceHistory.filter(_item => _item[2] != 0).slice(-2)
                let currentPrice = getAvgPriceOfArray(currentPriceArray)

                let minPriceArray = item.priceHistory.slice(dateFilterStartIndex, dateFilterEndIndex).filter(_item => _item[2] != 0).sort((a, b) => a[1] - b[1]).slice(0, 3)
                let minPrice = getAvgPriceOfArray(minPriceArray)

                let highestPriceArray = item.priceHistory.slice(dateFilterStartIndex, dateFilterEndIndex).filter(_item => _item[2] != 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
                let highestPrice = getAvgPriceOfArray(highestPriceArray)

                let priceBeforeSaleArray = null, priceBeforeSale = null, minPriceDuringSaleArray = null, minPriceDuringSale = null
                if (event.type == 'tournament' && event.saleStartDate) {
                    priceBeforeSaleArray = item.priceHistory.slice(0, saleStartIndex).filter(_item => _item[2] != 0).slice(-3)
                    priceBeforeSale = getAvgPriceOfArray(priceBeforeSaleArray)

                    minPriceDuringSaleArray = item.priceHistory.slice(saleStartIndex, saleEndIndex).filter(_item => _item[2] != 0).sort((a, b) => a[1] - b[1]).slice(0, 3)
                    minPriceDuringSale = getAvgPriceOfArray(minPriceDuringSaleArray)

                    Object.assign(item, {
                        priceBeforeSaleArray, priceBeforeSale, minPriceDuringSaleArray, minPriceDuringSale,
                        highestPriceAndMinPriceDuringSaleDiff: +(highestPrice / minPriceDuringSale).toFixed(2),
                        minPriceAndPriceBeforeSaleDiff: calculateRatio(minPrice, priceBeforeSale),
                        minPriceDuringSaleAndPriceBeforeSaleDiff: calculateRatio(minPriceDuringSale, priceBeforeSale)
                    })
                }

                return {
                    ...item, name: item.name, id: itemIndex + 1,
                    currentPriceArray, currentPrice,
                    minPriceArray, minPrice,
                    highestPriceArray, highestPrice, highestPriceDiff2: +(highestPrice / minPrice).toFixed(2),
                    currentPriceAndMinPriceDiff: +(currentPrice / minPrice).toFixed(2),
                    currentPriceHighestPriceDiff: calculateRatio(currentPrice, highestPrice)
                }
            })
            processedItems = processedItems.concat(_processedItems)
        })

        batch(() => {
            if ((eventName.value == 'Any' && !['case', 'agent'].includes(type.value)) || event.saleStartDate) {
                tableFields.value.splice(3, 0, { toolTip: { type: 'array', path: 'priceBeforeSaleArray' }, fields: [{ name: 'priceBeforeSale', type: 'number', sortable: true, calculate: 'addition' }] })
                tableFields.value.splice(4, 0, {
                    toolTip: { type: 'array', path: 'minPriceDuringSaleArray' },
                    fields: [
                        { name: 'minPriceDuringSale', type: 'number', sortable: true, calculate: 'addition' },
                        { name: '(%)', type: 'number', path: 'minPriceDuringSaleAndPriceBeforeSaleDiff', template: '(_r%)', sortable: true }
                    ]
                })
                tableFields.value[5].fields.push({ name: '(%)', type: 'number', path: 'minPriceAndPriceBeforeSaleDiff', template: '(_r%)', sortable: true })
                tableFields.value[6].fields.splice(1, 0, { name: '(x)', type: 'number', path: 'highestPriceAndMinPriceDuringSaleDiff', template: '(_rx)', sortable: true })
            }

            isLoading.value = false
            items.value = processedItems
            sortValue.value = { name: 'id', value: true }
            currenDataFilterString.value = filterString
            if (new Date(startDate.value) > new Date(endDate.value)) { document.querySelector('#endDateInput').value = '; endDate.value = ' }
        })
    }

    const Filters = () => {
        const variantsHandle = () => {
            let searchString = (eventName.value != 'Any' ? `${eventName.value}` : '') + ((eventName.value != 'Any' && type.value != 'Any') ? ' ' : '') + (type.value != 'Any' ? `${type.value}` : '')

            const variants = [
                [
                    ['Paper', 'Glitter', 'Holo', 'Foil', 'Gold'],
                    ['sticker', '']
                ],
                [
                    ['Paper', 'Glitter', 'Holo', 'Gold'],
                    [
                        'Shanghai 2024 sticker', 'Shanghai 2024 autograph', 'Shanghai 2024', 'Copenhagen 2024 sticker', 'Copenhagen 2024 autograph', 'Copenhagen 2024', 'Paris 2023 sticker', 'Paris 2023 autograph', 'Paris 2023',
                        'Rio 2022 sticker', 'Rio 2022 autograph', 'Rio 2022', 'Antwerp 2022 sticker', 'Antwerp 2022 autograph', 'Antwerp 2022', 'autograph'
                    ]
                ],
                [
                    ['Paper', 'Holo', 'Foil', 'Gold'],
                    ['Stockholm 2021 sticker', 'Stockholm 2021', '2020 RMR', '2020 RMR sticker']
                ],
                [
                    ['Paper', 'Gold'],
                    ['Stockholm 2021 patch', 'patch']
                ],
                [
                    ['Paper', 'Holo', 'Gold'],
                    ['Stockholm 2021 autograph']
                ],
                [
                    [],
                    ['Shanghai 2024 capsule', 'Copenhagen 2024 capsule', 'Paris 2023 capsule', 'Antwerp 2022 capsule', 'Stockholm 2021 capsule', 'Rio 2022 capsule', 'Operation Riptide', 'Operation Riptide sticker', 
                        'Operation Riptide agent',
                        'Operation Riptide case', 'Operation Riptide patch', 'capsule', 'souvenirPackage', 'patchPackage', 'case', 'agent',/* 'graffiti',*/
                        'Operation Broken Fang', 'Operation Broken Fang sticker', 'Operation Broken Fang agent', 'Operation Broken Fang case', 'Operation Broken Fang patch'/*, 'Operation Broken Fang graffiti'*/,
                        'The armory', 'The armory sticker', 'The armory case', 'The armory charm']
                ]
            ]

            return variants.find(variant => variant[1].some(item => item.includes(searchString)))[0]
        }

        const _types = useComputed(() =>
            eventName.value == 'Any' ? ['sticker', 'autograph', 'capsule', 'souvenirPackage', 'patch', 'patchPackage', 'case', 'agent'/*, 'graffiti'*/] : Object.keys(events.find(event => event.name == eventName.value).items))

        const _variants = useComputed(() => variantsHandle())

        return (
            <div className="filters">
                <CustomSelect id="event-name" title="Event Name" state={eventName} options={events.map(item => { return item.name })}
                    func={() => {
                        batch(() => {
                            if (!_types.value.includes(type.value)) type.value = 'Any';
                            if (!_variants.value.includes(variant.value)) variant.value = 'Any'
                            period.value = 'Any'
                            startDate.value = ''
                            endDate.value = ''
                        })
                    }} />
                <CustomSelect id="type" title="Type" state={type} options={_types.value} func={() => { if (!_variants.value.includes(variant.value)) variant.value = 'Any' }} />
                <CustomSelect id="variant" title="Variant" state={variant} options={['capsule', 'souvenirPackage', 'agent', 'patch', 'patchPackage'].includes(type.value) ? [] : _variants.value} />
                <CustomSelect id="period" title="Period" state={period} options={['Sale Period', 'Last 3 Months', 'Last Month'].slice(events.find(event => event.name == eventName.value)?.type != 'tournament' ? 1 : 0)}
                    func={() => {
                        if (eventName.value != 'Any') {
                            batch(() => {
                                startDate.value = period.value == 'Sale Period' ? events.find(event => event.name == eventName.value).saleStartDate :
                                    period.value == 'Last 3 Months' ? new Date(new Date().setMonth(new Date().getMonth() - 3)) :
                                        period.value == 'Last Month' ? new Date(new Date().setMonth(new Date().getMonth() - 1)) : ''
                                endDate.value = period.value == 'Sale Period' ? events.find(event => event.name == eventName.value).endDate : ''
                            })
                        }
                    }} />

                <div className="date-filters">
                    <input type="date" id="startDateInput"
                        min={eventName.value != 'Any' ? events.find(item => item.name == eventName.value).releaseDate.toISOString().split('T')[0] : events[0].releaseDate.toISOString().split('T')[0]}
                        max={endDate.value != '' ? new Date(endDate.value).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        value={startDate.value && new Date(startDate.value).toISOString().split('T')[0]}
                        onChange={(e) => {
                            batch(() => {
                                startDate.value = e.target.value;
                                period.value = 'Any'
                            })
                            if (endDate.value != '' && new Date(startDate.value) > new Date(endDate.value)) { document.querySelector('#endDateInput').value = ''; endDate.value = '' }
                        }}
                    />
                    <span>-</span>
                    <input type="date" id="endDateInput"
                        min={startDate.value != '' ? new Date(startDate.value).toISOString().split('T')[0] : eventName.value != 'Any' ? events.find(item => item.name == eventName.value).releaseDate.toISOString().split('T')[0] : ''}
                        max={new Date().toISOString().split('T')[0]}
                        value={endDate.value && new Date(endDate.value).toISOString().split('T')[0]}
                        onChange={(e) => {
                            batch(() => {
                                endDate.value = e.target.value;
                                period.value = 'Any'
                            })
                            if (startDate.value != '' && new Date(startDate.value) > new Date(endDate.value)) { document.querySelector('#startDateInput').value = ""; startDate.value = "" }
                        }}
                    />
                </div>
                <button className="btn" onClick={() => { fetchAndFormatData() }}><i className="fa-solid fa-magnifying-glass" /></button>
            </div>
        )
    }

    return (
        <div className="event-items-price-changes-page container">
            <header>
                <div className="page-name">
                    <div className="icon-wrapper">
                        <i className="fa-solid fa-table-list" />
                    </div>
                    <span>Event Items Price Changes</span>
                </div>
                <Filters />
            </header>
            <section>
                {isLoading.value ? <Loading /> :
                    items.value ? <Table data={items} sortState={sortValue} calculate={true} fields={tableFields.value} /> :
                        pageMsg.value && <span className="page-msg-box">{pageMsg.value}</span>}
            </section>
        </div>
    )
}