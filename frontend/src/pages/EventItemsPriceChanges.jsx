import { batch, useComputed, useSignal } from '@preact/signals-react';
import { big, calculateDateFilterIndex, useGetRequest } from '../utils';
import { events } from '../events';
import HeaderWithIcon from '../components/HeaderWithIcon';
import CustomSelect from '../components/CustomSelect';
import Bubbles from '../components/Bubbles';
import Table from '../components/Table';

export default function EventItemsPriceChanges() {
    const eventName = useSignal('Any')
    const type = useSignal('Any')
    const variant = useSignal('Any')
    const period = useSignal('Any')
    const startDate = useSignal('')
    const endDate = useSignal('')
    const sortState = useSignal({ field: 'id', isAscending: true })
    const activeFilters = useSignal(null)

    const pageMsg = useSignal(null)
    const tableData = useSignal(null)
    const tableColumns = useSignal(null)

    const fetchAndFormatData = async () => {
        const filterString = eventName.value + type.value + variant.value + period.value

        if ((eventName.value == 'Any' && type.value == 'Any' && variant.value == 'Any') || activeFilters.value == filterString) return;

        batch(() => {
            tableColumns.value = [
                { fields: [{ label: 'id', type: 'number', sortable: true }] },
                { fields: [{ label: 'image', type: 'image', path: 'name' }] },
                { fields: [{ label: 'name', type: 'text', sortable: true }] },
                { fields: [{ label: 'market-page', type: 'link', className: 'fa-brands fa-steam', path: 'name' }] },
                { toolTip: { path: 'priceBeforeSaleArr' }, fields: [{ label: 'priceBeforeSale', type: 'number', sortable: true, calculate: 'average' }] },
                {
                    toolTip: { path: 'minPriceDuringSaleArr' },
                    fields: [{ label: 'minPriceDuringSale', type: 'number', sortable: true, calculate: 'average' }, { label: '(%)', type: 'number', path: 'minPriceDuringSaleDropPct', template: '(_r%)', sortable: true }]
                },
                {
                    toolTip: { path: 'minPriceArr' },
                    fields: [{ label: 'minPrice', type: 'number', sortable: true, calculate: 'average' }, { label: '(%)', type: 'number', path: 'minPriceDropPct', template: '(_r%)', sortable: true }]
                },
                {
                    toolTip: { path: 'maxPriceArr' },
                    fields: [
                        { label: 'maxPrice', type: 'number', sortable: true, calculate: 'average' },
                        { label: '(x)', type: 'number', path: 'maxToMinPriceDuringSaleRatio', template: '(_rx)', sortable: true },
                        { label: '(x)', type: 'number', path: 'maxToMinPriceRatio', template: '(_rx)', sortable: true }
                    ]
                },
                {
                    toolTip: { path: 'priceArr' },
                    fields: [
                        { label: 'price', type: 'number', sortable: true, calculate: 'average' },
                        { label: '(x)', type: 'number', path: 'currentToMinPriceRatio', template: '(_rx)', sortable: true }
                    ]
                },
                { fields: [{ label: 'volume', type: 'number', sortable: true, calculate: 'addition' }] },
            ]
            tableData.value = 'loading'
            pageMsg.value = null
            activeFilters.value = filterString
        })

        const response = await useGetRequest(`get-event-items/${eventName.value}/${type.value}/${variant.value}`)
        if (!response.success) return batch(() => { pageMsg.value = response.msg; tableData.value = null; activeFilters.value = null })

        const arr = JSON.parse(JSON.stringify(response.data))
        let processedItems = []

        const getAvgPriceOfArr = arr => +big(arr.reduce((t, c) => big(t).plus(big(c[1]).times(c[2])), 0)).div(arr.reduce((t, c) => big(t).plus(c[2]), 0)).toFixed(2)
        const calculateRatio = (num1, num2) => +big(big(num1).div(num2)).minus(1).times(100).toFixed(0) // input 1.95, 7.04 output: -72

        for (let i in arr) {
            let { eventName, items } = arr[i]
            const event = events.find(event => event.name == eventName)

            const saleStartDateIndex = event.saleStartDate ? items[0].priceHistory.findIndex(item => item[0] == new Date(event.saleStartDate).toDateString().slice(4)) : 0
            const saleEndDateIndex = event.endDate ? items[0].priceHistory.findIndex(item => item[0] == new Date(event.endDate).toDateString().slice(4)) : 0

            let dateFilterStartIndex = calculateDateFilterIndex(period.value == 'Any' ? startDate.value : null, items[0].priceHistory, event.name, 'start', period.value == 'Any' ? null : period.value)
            let dateFilterEndIndex = calculateDateFilterIndex(period.value == 'Any' ? endDate.value : null, items[0].priceHistory, event.name, 'end', period.value == 'Any' ? null : period.value)

            const _processedItems = items.map((item, itemIndex) => {
                let priceArr = item.priceHistory.filter(_item => _item[2] != 0).slice(-2)
                let price = getAvgPriceOfArr(priceArr)
                let volume = priceArr.reduce((t, c) => +big(t).plus(c[2]), 0)

                let priceHistoryFilteredByDate = item.priceHistory.slice(dateFilterStartIndex, dateFilterEndIndex).filter(_item => _item[2] != 0)

                let minPriceArr = priceHistoryFilteredByDate.sort((a, b) => a[1] - b[1]).slice(0, 3)
                let minPrice = getAvgPriceOfArr(minPriceArr)

                let maxPriceArr = priceHistoryFilteredByDate.sort((a, b) => b[1] - a[1]).slice(0, 3)
                let maxPrice = getAvgPriceOfArr(maxPriceArr)

                let priceBeforeSaleArr = null, priceBeforeSale = null, minPriceDuringSaleArr = null, minPriceDuringSale = null

                if (event.type == 'tournament' && event.saleStartDate) {
                    priceBeforeSaleArr = item.priceHistory.slice(0, saleStartDateIndex).filter(_item => _item[2] != 0).slice(-3)
                    priceBeforeSale = getAvgPriceOfArr(priceBeforeSaleArr)

                    minPriceDuringSaleArr = item.priceHistory.slice(saleStartDateIndex, saleEndDateIndex).filter(_item => _item[2] != 0).sort((a, b) => a[1] - b[1]).slice(0, 3)
                    minPriceDuringSale = getAvgPriceOfArr(minPriceDuringSaleArr)

                    Object.assign(item, {
                        priceBeforeSaleArr, priceBeforeSale, minPriceDuringSaleArr, minPriceDuringSale,
                        maxToMinPriceDuringSaleRatio: +big(maxPrice).div(minPriceDuringSale).toFixed(2),
                        minPriceDropPct: calculateRatio(minPrice, priceBeforeSale),
                        minPriceDuringSaleDropPct: calculateRatio(minPriceDuringSale, priceBeforeSale)
                    })
                }

                return {
                    ...item, id: itemIndex + 1, name: item.name, price, priceArr, volume, minPrice, minPriceArr, maxPrice, maxPriceArr,
                    maxToMinPriceRatio: +big(maxPrice).div(minPrice).toFixed(2), currentToMinPriceRatio: +big(price).div(minPrice).toFixed(2)
                }
            })

            processedItems = processedItems.concat(_processedItems)
        }

        batch(() => {
            pageMsg.value = null
            tableData.value = processedItems
            sortState.value = { field: 'id', isAscending: true }
            if (eventName.value != 'Any' && !events.find(event => event.name == eventName.value).saleStartDate) {
                let updatedTableColumns = tableColumns.value.filter((_, index) => index != 4 && index != 5).map((item, index) => {
                    if (index == 4) return { ...item, fields: item.fields.slice(0, 1) }
                    if (index == 5) return { ...item, fields: item.fields.slice(0, 2) }
                    return item
                })
                tableColumns.value = updatedTableColumns
            }
        })
    }

    const Filters = () => {
        const typeOptions = useComputed(() => eventName.value == 'Any' ? ['Sticker', 'Autograph', 'Capsule', 'Souvenir Package', 'Case', 'Patch', 'Charm'] : Object.keys(events.find(event => event.name == eventName.value).items))

        const variantOptions = useComputed(() => {
            if (events.find(event => event.name == eventName.value)?.type == 'operation' || ['Capsule', 'Souvenir Package', 'Patch Package', 'Case', 'Agent', 'Charm'].includes(type.value)) return []
            else if (type.value == 'Patch') return ['Paper', 'Gold']
            else if (eventName.value == 'Any') return ['Paper', 'Glitter', 'Holo', 'Foil', 'Gold']
            else {
                if (['2020 RMR', 'Stockholm 2021'].includes(eventName.value)) {
                    if (type.value == 'Sticker' || type.value == 'Any') return ['Paper', 'Holo', 'Foil', 'Gold']
                    else if (type.value == 'Autograph') return ['Paper', 'Holo', 'Gold']
                }
                else return ['Paper', 'Glitter', 'Holo', 'Gold']
            }
        })

        const onEventNameChange = () => {
            if (!variantOptions.value.includes(variant.value)) variant.value = 'Any'
            if (!typeOptions.value.includes(type.value)) type.value = 'Any'
        }

        const onTypeChange = () => { if (!variantOptions.value.includes(variant.value)) variant.value = 'Any' }

        return (
            <div className="filters">
                <CustomSelect title="Event Name" state={eventName} func={onEventNameChange} options={events.map(item => item.name)} />
                <CustomSelect title="Type" state={type} func={onTypeChange} options={typeOptions.value} />
                <CustomSelect title="Variant" state={variant} options={variantOptions.value} />
                <CustomSelect title="Period" state={period} options={['1 Year After Release', '2 Years After Release']} />
                <button className="btn search-btn" onClick={() => fetchAndFormatData()} disabled={tableData.value == 'loading'}><i className="fa-solid fa-magnifying-glass" /></button>
            </div>
        )
    }

    const SectionContent = () => {
        if (pageMsg.value) return <span className="msg-box">{pageMsg}</span>
        if (tableData.value == 'loading') return <div className="bubbles-wrapper"><Bubbles /></div>
        if (Array.isArray(tableData.value)) return <Table columns={tableColumns.value} sortState={sortState} calculate={true} data={tableData} />
        return null
    }

    return (
        <div className="event-items-price-changes-page container">
            <header>
                <HeaderWithIcon title="Event Items Price Changes" iconClass="fa-solid fa-table-list" />
                <Filters />
            </header>
            <section>
                <SectionContent />
            </section>
        </div>
    )
}