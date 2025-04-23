import { useEffect } from 'react'
import { batch, useComputed, useSignal, useSignalEffect } from '@preact/signals-react'
import { big } from '../../utils'
import { events } from '../../events'
import CustomSelect from '../../components/CustomSelect'
import AddInvestmentModal from './AddInvestmentModal'
import InvestmentItemModal from './InvestmentsItemModal'
import Table from '../../components/Table'

export default function Investments({ user, itemTypes, variants }) {
    const windowInnerWidth = useSignal(window.innerWidth)
    const showFilters = useSignal(false)
    const showAddInvestmentModal = useSignal(false)
    const selectedItem = useSignal(null)

    const type = useSignal('Any')
    const eventName = useSignal('Any')
    const variant = useSignal('Any')
    const status = useSignal('available')
    const filterValues = useComputed(() => [type.value, eventName.value, variant.value])
    const sortState = useSignal({ field: 'profitAsX', isAscending: false })

    const investments = useSignal([])
    useSignalEffect(() =>
        user.value ? investments.value = user.value.investments.map(item => {
            if (item.quantity > 0) {
                item.profit = +big(big(item.marketPrice).minus(item.avgCost)).times(item.quantity).toFixed(2)
                item.profitAsX = +big(item.marketPrice).div(item.avgCost).toFixed(2)
                item.totalMarketValue = +big(item.marketPrice).times(item.quantity).toFixed(2)
            }

            if (item.soldQuantity > 0) item.netSalesProfitAsX = +big(big(item.avgCost).plus(big(item.netSalesProfit).div(item.soldQuantity))).div(item.avgCost).toFixed(2)

            return item;
        })
            .filter(item => status.value == 'available' ? item.quantity > 0 : status.value == 'sold' ? item.quantity == 0 : item)
            .filter(item => filterValues.value.filter(filter => filter != 'Any').every(filters => item.tags.includes(filters)))
            .sort((a, b) => { return sortState.value.isAscending ? a[sortState.value.field] - b[sortState.value.field] : b[sortState.value.field] - a[sortState.value.field] }) : []
    )

    const setBodyOverflow = value => document.querySelector('body').style.overflow = value

    const InvestmentStats = () => {
        const investmentStats = useComputed(() => {
            const currentTotalCost = +investments.value.reduce((t, c) => big(t).plus(status.value == 'available' ? c.currentTotalCost : c.totalCost), 0).toFixed(2)
            const totalMarketValue = +investments.value.reduce((t, c) => big(t).plus(status.value == 'available' ? c.totalMarketValue : c.totalSales), 0).toFixed(2)
            const profit = +big(totalMarketValue).minus(currentTotalCost)
            const profitAsX = currentTotalCost == 0 ? 0 : +big(totalMarketValue).div(currentTotalCost).toFixed(2)

            return { currentTotalCost, totalMarketValue, profit, profitAsX }
        })

        return (
            <div className="investment-stats">
                <div className="investment-stats-item">
                    <div className="icon-background">
                        <i className="fa-solid fa-hand-holding-dollar" />
                    </div>
                    <span>{investmentStats.value.currentTotalCost}</span>
                </div>
                <div className="investment-stats-item">
                    <div className="icon-background">
                        <i className={status.value == 'available' ? "fa-solid fa-vault" : "fa-solid fa-sack-dollar"} />
                    </div>
                    <span>{investmentStats.value.totalMarketValue}</span>
                </div>
                <div className="investment-stats-item profit">
                    <div className="icon-background">
                        <i className="fa-solid fa-money-bill-trend-up" />
                    </div>
                    <span className={investmentStats.value.profit > 0 ? 'green' : investmentStats.value.profit < 0 ? 'red' : ''}>
                        {`${investmentStats.value.profit} (${investmentStats.value.profitAsX}x)`}
                    </span>
                </div>
            </div>
        )
    }

    const Filters = () => {
        if (!showFilters.value) return null;

        return (
            <div className="filters">
                <CustomSelect title="Type" state={type} options={itemTypes} />
                <CustomSelect title="Event" state={eventName} options={events.map(event => event.name)} />
                <CustomSelect title="Variant" state={variant} options={variants} />
                <CustomSelect title="Status" state={status} func={() => { sortState.value = { field: status.value == 'available' ? 'profitAsX' : 'netSalesProfitAsX', isAscending: false } }} options={['available', 'sold']}
                    addAnyToOptions={false} />
                <button className="btn-secondary clear-filters-btn" onClick={() => batch(() => {
                    type.value = 'Any'; eventName.value = 'Any'; variant.value = 'Any'; status.value = 'available';
                    sortState.value = { field: status.value == 'available' ? 'profitAsX' : 'netSalesProfitAsX', isAscending: false }
                })}>
                    <i className="fa-solid fa-filter-circle-xmark" />
                </button>
            </div>
        )
    }

    const TableWrapper = () => {
        const showInvestmentItemDetails = (index) => {
            selectedItem.value = investments.value[index]
            setBodyOverflow('hidden')
        }

        const tableColumns = useComputed(() => {
            let columns = status.value == 'available' ?
                [
                    { fields: [{ label: 'image', type: 'image', path: 'name' }] },
                    { fields: [{ label: 'name', type: 'text' }] },
                    { fields: [{ label: 'market-page', type: 'link', className: 'fa-brands fa-steam', path: 'name' }] },
                    { fields: [{ label: 'quantity', type: 'number', sortable: true, calculate: 'addition' }] },
                    { fields: [{ label: 'avgCost', type: 'number', sortable: true }] },
                    { fields: [{ label: 'marketPrice', type: 'number', sortable: true }] },
                    { fields: [{ label: 'profit', type: 'number', sortable: true, highlightBaseline: 0 }, { label: '(x)', type: 'number', path: 'profitAsX', template: '(_rx)', sortable: true, highlightBaseline: 1 }] },
                    { fields: [{ label: 'currentTotalCost', type: 'number', sortable: true }] },
                    { fields: [{ label: 'totalMarketValue', type: 'number', sortable: true }] },
                    { fields: [{ label: 'button', type: 'button', className: 'fa-solid fa-ellipsis-vertical', onClick: showInvestmentItemDetails }] }
                ]
                :
                [
                    { fields: [{ label: 'image', type: 'image', path: 'name' }] },
                    { fields: [{ label: 'name', type: 'text' }] },
                    { fields: [{ label: 'market-page', type: 'link', className: 'fa-brands fa-steam', path: 'name' }] },
                    { fields: [{ label: 'soldQuantity', type: 'number', sortable: true, calculate: 'addition' }] },
                    { fields: [{ label: 'avgCost', type: 'number', sortable: true }] },
                    { fields: [{ label: 'avgSalePrice', type: 'number', sortable: true }] },
                    {
                        fields: [
                            { label: 'netSalesProfit', type: 'number', sortable: true, highlightBaseline: 0, calculate: 'addition' },
                            { label: '(x)', type: 'number', path: 'netSalesProfitAsX', template: '(_rx)', sortable: true, highlightBaseline: 1 }
                        ]
                    },
                    { fields: [{ label: 'button', type: 'button', className: 'fa-solid fa-ellipsis-vertical', onClick: showInvestmentItemDetails }] }
                ]


            if (windowInnerWidth <= 480) columns = status.value == 'available' ? [...columns.slice(0, 1), ...columns.slice(4, 7), ...columns.slice(-1)] : [...columns.slice(0, 1), ...columns.slice(4)]
            else if (windowInnerWidth <= 768) columns = status.value == 'available' ? [...columns.slice(0, 1), ...columns.slice(4)] : [...columns.slice(0, 1), ...columns.slice(3)]

            return columns
        })

        useEffect(() => {
            const handleResize = () => windowInnerWidth.value = window.innerWidth
            window.addEventListener('resize', handleResize)
            return () => { window.removeEventListener('resize', handleResize) }
        }, [])

        if (investments.value.length == 0) return null;
        return <Table data={investments} sortState={sortState} calculate={window.innerWidth > 480} columns={tableColumns.value} />
    }

    if (!user.value) return <span className="msg-box" style={{ margin: '1rem auto' }}>Please log in to view your investments</span>

    return (
        <div className="investments-page container">
            <header>
                <InvestmentStats />
                <div className="header-buttons">
                    <button className="btn-secondary show-filters-btn" onClick={() => showFilters.value = !showFilters.value}><i className="fa-solid fa-filter" /></button>
                    <button className="btn-secondary" onClick={() => { showAddInvestmentModal.value = true; setBodyOverflow('hidden') }}>
                        <i className="fa-solid fa-plus" />
                        <span>Add Investments</span>
                    </button>
                </div>
            </header>
            <Filters />
            <section>
                <TableWrapper />
            </section>
            <InvestmentItemModal item={selectedItem} user={user} setBodyOverflow={setBodyOverflow} />
            <AddInvestmentModal showAddInvestmentModal={showAddInvestmentModal} user={user} setBodyOverflow={setBodyOverflow} />
        </div>
    )
}