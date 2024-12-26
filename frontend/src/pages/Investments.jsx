import { batch, useComputed, useSignal, useSignalEffect } from '@preact/signals-react';
import Papaparse from 'papaparse';
import { usePostRequest } from '../utils';
import Table from '../components/Table';
import Form from '../components/Form';
import ToolTip from '../components/ToolTip';
import CustomSelect from '../components/CustomSelect';

export default function Investments({ user, blue, green, red }) {
    const showFilters = useSignal(false)
    const showAddInvestmentSection = useSignal(false)
    const investmentItemDetails = useSignal(null)

    const type = useSignal('Any')
    const eventName = useSignal('Any')
    const variant = useSignal('Any')
    const sortValue = useSignal({ name: 'x', value: false })
    const filterValues = useComputed(() => [type.value, eventName.value, variant.value])

    const investments = useSignal([])
    useSignalEffect(() =>
        user.value ? investments.value = user.value.investments.map(item => {
            item.buyPrice = +(item.totalCost / item.quantity).toFixed(3);
            item.totalMarketValue = +(item.marketPrice * item.quantity).toFixed(2);
            item.worth = +(item.totalMarketValue - item.totalCost).toFixed(2);
            item.x = +(item.marketPrice / item.buyPrice).toFixed(2);
            return item;
        }).filter(item => filterValues.value.filter(filter => filter != 'Any').every(filters => item.tags.includes(filters))).sort((a, b) => { return b.x - a.x }) : []
    )
    console.log(investments.value)
    const changeBodyOverflow = (value) => document.querySelector('body').style.overflow = value

    const AddInvestmentSection = () => {
        const addInvestmentMethod = useSignal(null)
        const addInvestmentFormMsg = useSignal(null)
        const tableData = useSignal(null)
        const addInvestmentFromCsvFileMsg = useSignal(null)

        const convertMilliseconds = (ms) => {
            const minutes = Math.floor(ms / 60000)
            const seconds = Math.floor((ms % 60000) / 1000).toFixed(0)

            return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
        }

        const readCsvFile = (file) => {
            Papaparse.parse(file, {
                header: true, dynamicTyping: true, complete: (results) => {
                    let filteredData = results.data.filter(item => item[' App Id'] == 730).filter(item => item[' Type'] == 'purchase').filter(item => item[' Display Price'].slice(-3) == 'USD')
                    let groupedData = []

                    for (let i in filteredData) {
                        let name = filteredData[i][' Market Name']
                        let index = groupedData.findIndex(item => item.name == name)
                        let price = +(Number(filteredData[i][' Display Price'].slice(1, -4)).toFixed(2))

                        if (index == -1) groupedData.push({ name, totalCost: price, quantity: 1 })
                        else {
                            groupedData[index].totalCost += price
                            groupedData[index].quantity++
                        }
                    }
                    groupedData.map(item => { return item.totalCost = +item.totalCost.toFixed(2) })
                    tableData.value = groupedData
                }
            })
        }

        const deleteItemFromTable = (index) => {
            let updatedTableData = [...tableData.value]
            updatedTableData.splice(index, 1)
            tableData.value = updatedTableData
        }

        const addInvestmentFromCsvFile = async () => {
            if (!tableData.value || tableData.value.length == 0) return addInvestmentFromCsvFileMsg.value = 'No item found to add.';

            document.getElementById('confirm-csv-file-btn').disabled = true
            addInvestmentFromCsvFileMsg.value = `This process will take approximately ${convertMilliseconds(tableData.value.length * 3200)}.`

            const response = await usePostRequest('/add-investment', { userId: user.value._id, timezoneOffSet: new Date().getTimezoneOffset(), items: tableData.value, token: document.cookie })
            if (!response.success) return addInvestmentFromCsvFileMsg.value = response.msg

            batch(() => {
                addInvestmentFromCsvFileMsg.value = null
                tableData.value = null
                addInvestmentMethod.value = null
                showAddInvestmentSection.value = false
                user.value = response.user
            })

            document.getElementById('confirm-csv-file-btn').disabled = false
            changeBodyOverflow('auto')
        }

        const addInvestmentManually = async (e) => {
            e.preventDefault()

            let { name: { value: name }, buyPrice: { value: buyPrice }, quantity: { value: quantity }, date: { value: date } } = e.target

            if (name == '') addInvestmentFormMsg.value = 'Name cannot be empty.'
            else if (+buyPrice <= 0) addInvestmentFormMsg.value = 'Buy price must be greater than 0.'
            else if (+quantity <= 0) addInvestmentFormMsg.value = 'Quantity must be greater than 0.'
            else {
                buyPrice = buyPrice.includes(',') ? +buyPrice.replaceAll(',', '.') : +buyPrice

                const response = await usePostRequest('/add-investment',
                    { userId: user.value._id, timezoneOffSet: new Date().getTimezoneOffset(), items: [{ name, date: date || null, totalCost: buyPrice * +quantity, quantity: +quantity }], token: document.cookie })
                if (!response.success) return addInvestmentFormMsg.value = response.msg

                e.target.reset()
                batch(() => {
                    addInvestmentFormMsg.value = null
                    addInvestmentMethod.value = null
                    showAddInvestmentSection.value = false
                    user.value = response.user
                })
                changeBodyOverflow('auto')
            }
        }

        if (!showAddInvestmentSection.value) return;

        return (
            <div className="modal-backdrop">
                <div className="modal-container">
                    <div className="add-investment-modal">

                        <div className="modal-header">
                            <div className="page-name">
                                <div className="icon-wrapper">
                                    <i className="fa-solid fa-plus" />
                                </div>
                                <span>Add Investment</span>
                            </div>
                            <i className="fa-solid fa-xmark" onClick={() => {
                                batch(() => {
                                    addInvestmentMethod.value = null;
                                    tableData.value = null
                                    addInvestmentFromCsvFileMsg.value = null
                                    addInvestmentFormMsg.value = null
                                    showAddInvestmentSection.value = false;
                                })
                                document.querySelector('body').style.overflow = 'auto';
                            }} />
                        </div>

                        <div className="add-investment-methods">
                            <button className="btn-secondary" onClick={() => addInvestmentMethod.value = 'manually'} style={{ borderColor: addInvestmentMethod.value == 'manually' ? blue : '' }}>
                                <i className="fa-brands fa-wpforms" />
                                <span>Manually</span>
                            </button>
                            <button className="btn-secondary" onClick={() => addInvestmentMethod.value = 'csv'} style={{ borderColor: addInvestmentMethod.value == 'csv' ? blue : '' }}>
                                <i className="fa-solid fa-file-csv" />
                                <span>Import Csv File</span>
                            </button>
                            {addInvestmentMethod.value == "csv" &&
                                <label className="import-csv-file-label" onDrop={(e) => { e.preventDefault(); readCsvFile(e.dataTransfer.files[0]); }} onDragOver={(e) => e.preventDefault()} >
                                    <i className="fa-solid fa-file-import" />
                                    <span>Import File</span>
                                    <input id="import-csv-file-input" type="file" accept=".csv" onChange={(e) => readCsvFile(e.target.files[0])} />
                                </label>
                            }
                            {(tableData.value && addInvestmentMethod.value == "csv") &&
                                <button id="confirm-csv-file-btn" className="btn" onClick={() => addInvestmentFromCsvFile()}>
                                    <i className="fa-solid fa-check" />
                                    <span>Confirm Data And Save</span>
                                </button>
                            }
                            {addInvestmentFromCsvFileMsg.value && <span className="add-investment-from-csv-file-result">{addInvestmentFromCsvFileMsg.value}</span>}
                        </div>

                        <span className="divider" />

                        {addInvestmentMethod.value == "manually" &&
                            <div className="form-wrapper">
                                <div className="form-wrapper">
                                    <Form title="Add Investment" submitFunction={addInvestmentManually} formMsgState={addInvestmentFormMsg} submitBtnInnerText="Add Investment"
                                        fields={[{ align: 'column', fields: [{ name: 'name', type: 'text' }, { name: 'buyPrice', type: 'number' }, { name: 'quantity', type: 'number' }, { name: 'date', type: 'date' }] }]} />
                                </div>
                            </div>
                        }

                        {(tableData.value && addInvestmentMethod.value == 'csv') &&
                            <div className="table-wrapper">
                                <Table data={tableData} calculateAddition={false}
                                    fields={[
                                        { fields: [{ name: 'image', type: 'image', path: 'name' }] },
                                        { fields: [{ name: 'name', type: 'text' }] },
                                        { fields: [{ name: 'totalCost', type: 'number' }] },
                                        { fields: [{ name: 'quantity', type: 'number' }] },
                                        { fields: [{ name: 'button', type: 'button', className: 'fa-regular fa-trash-can', onClick: (index) => deleteItemFromTable(index) }] }
                                    ]}
                                />
                            </div>
                        }

                    </div>
                </div>
            </div>
        )
    }

    const InvestmentItemDetails = () => {
        const formatNumber = num => num % 1 === 0 ? num.toString() : num.toFixed(3).replace(/\.?0+$/, '')
        const formatDate = date => new Intl.DateTimeFormat(navigator.language, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
        const handleTransactionFormMsg = useSignal(null)

        const handleTransaction = async (e) => {
            e.preventDefault()

            let { price: { value: price }, quantity: { value: quantity }, date: { value: date }, transactionType: { value: transactionType } } = e.target

            if (+price <= 0) handleTransactionFormMsg.value = 'Price must be greater than 0.'
            else if (+quantity <= 0) handleTransactionFormMsg.value = 'Quantity must be greater than 0.'
            else if (transactionType == '') handleTransactionFormMsg.value = 'You must select a transaction type.'
            else {
                price = price.includes(',') ? +price.replaceAll(',', '.') : +price

                const response = await usePostRequest('/save-transaction',
                    { userId: user.value._id, itemId: investmentItemDetails.value._id, timezoneOffSet: new Date().getTimezoneOffset(), price, date, quantity, transactionType, token: document.cookie })
                if (!response.success) return handleTransactionFormMsg.value = response.msg

                e.target.reset()
                batch(() => {
                    handleTransactionFormMsg.value = null
                    investmentItemDetails.value = null
                    user.value = response.user
                })
                changeBodyOverflow('auto')
            }
        }

        const undoLastUpdate = async () => {
            if (!investmentItemDetails.value.lastUpdate) return alert('There is no last update data for this investment item.')
            if (!confirm('Are you sure you want to undo the last update?')) return;

            const response = await usePostRequest('/undo-last-update', { userId: user.value._id, itemId: investmentItemDetails.value._id, token: document.cookie })
            if (!response.success) return alert(response.msg)

            batch(() => {
                investmentItemDetails.value = null
                user.value = response.user
            })
            changeBodyOverflow('auto')
        }

        const deleteInvestmentItem = async () => {
            if (!confirm(`Are you sure you want to delete the investment item? \n${investmentItemDetails.value.name}`)) return;

            const response = await usePostRequest('/delete-investment-item', { userId: user.value._id, itemId: investmentItemDetails.value._id, token: document.cookie })
            if (!response.success) return alert(response.msg)

            batch(() => {
                investmentItemDetails.value = null
                user.value = response.user
            })
            changeBodyOverflow('auto')
        }

        if (investmentItemDetails.value == null) return;

        return (
            <div className="modal-backdrop">
                <div className="modal-container">
                    <div className="investment-item-details-modal">

                        <i className="fa-solid fa-xmark" onClick={() => { investmentItemDetails.value = null; changeBodyOverflow('auto') }} />

                        <div className="investment-item-details">
                            <img src={`https://api.steamapis.com/image/item/730/${investmentItemDetails.value.name}`} />
                            <h4>{investmentItemDetails.value.name}</h4>
                            {['quantity', 'buyPrice', 'marketPrice', 'worth', 'x', 'totalCost', 'totalMarketValue'].map((field, fieldIndex) => {
                                const _value = investmentItemDetails.value[field]

                                return <div key={fieldIndex}>
                                    <span>{field.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                                    <span style={{ ...(['worth', 'x'].includes(field) && { color: _value > (field == 'x' ? 1 : 0) ? green : _value == (field == 'x' ? 1 : 0) ? '' : red, fontWeight: '800' }) }}>
                                        {formatNumber(_value)}
                                    </span>
                                </div>
                            })}
                            <div>
                                <span>Initial Purchase Date</span>
                                <span>{new Intl.DateTimeFormat(navigator.language, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(investmentItemDetails.value.initialPurchaseDate))}</span>
                            </div>
                            {investmentItemDetails.value.soldQuantity > 0 &&
                                <>
                                    <div>
                                        <span>Total Sales</span>
                                        <span>{investmentItemDetails.value.totalSales}</span>
                                    </div>
                                    <div>
                                        <span>Sold Quantity</span>
                                        <span>{investmentItemDetails.value.soldQuantity}</span>
                                    </div>
                                </>
                            }
                            <span className="divider" />
                        </div>

                        {investmentItemDetails.value.lastUpdate &&
                            <div className="investment-item-details">
                                <div>
                                    <span>Last Update Date</span>
                                    <span>{formatDate(investmentItemDetails.value.lastUpdate.date)}</span>
                                </div>
                                <div>
                                    <span>{investmentItemDetails.value.lastUpdate.totalCost ? 'Last Update Buy Price' : 'Last Update Sold Price'}</span>
                                    <span>
                                        {investmentItemDetails.value.lastUpdate.totalCost ? formatNumber(investmentItemDetails.value.lastUpdate.totalCost / investmentItemDetails.value.lastUpdate.quantity)
                                            :
                                            formatNumber(investmentItemDetails.value.lastUpdate.totalSales / investmentItemDetails.value.lastUpdate.soldQuantity)}
                                    </span>
                                </div>
                                <div>
                                    <span>{investmentItemDetails.value.lastUpdate.totalCost ? 'Last Update Quantity' : 'Last Update Sold Quantity'}</span>
                                    <span>{investmentItemDetails.value.lastUpdate.totalCost ? formatNumber(investmentItemDetails.value.lastUpdate.quantity) : formatNumber(investmentItemDetails.value.lastUpdate.soldQuantity)}</span>
                                </div>

                                <span className="divider" />
                            </div>
                        }

                        <form className="form" onSubmit={handleTransaction}>
                            <div className="form-body">
                                <div className="fields-group row">
                                    <div className="fields-group-item">
                                        <span>Price</span>
                                        <input name="price" type="number" step={'0.001'} />
                                    </div>
                                    <div className="fields-group-item">
                                        <span>Quantity</span>
                                        <input name="quantity" type="number" />
                                    </div>
                                </div>
                                <div className="fields-group">
                                    <div className="fields-group-item">
                                        <span>Date</span>
                                        <input name="date" type="date" />
                                    </div>
                                </div>
                            </div>
                            <div className="form-bottom">
                                <label>
                                    <input name="transactionType" type="radio" value="purchase" />
                                    <span>Purchase</span>
                                </label>
                                <label>
                                    <input name="transactionType" type="radio" value="sale" />
                                    <span>Sale</span>
                                </label>
                                <button className="btn" type="submit">
                                    <i className="fa-solid fa-check" />
                                </button>
                            </div>
                            {handleTransactionFormMsg.value && <span className="form-msg">{handleTransactionFormMsg.value}</span>}
                            <span className="divider" />
                        </form>


                        <div className="buttons">
                            <button className="btn-secondary" onClick={() => deleteInvestmentItem()}>
                                <i className="fa-regular fa-trash-can" />
                                <span>Delete Item</span>
                            </button>
                            {investmentItemDetails.value.lastUpdate &&
                                <button className="btn-secondary" onClick={() => undoLastUpdate()}>
                                    <i className="fa-solid fa-rotate-left" />
                                    <span>Undo Last Update</span>
                                </button>
                            }
                        </div>

                    </div>
                </div>
            </div>
        )
    }

    const InvestmentStats = () => {
        const investmentStats = useComputed(() => {
            const totalCost = +investments.value.reduce((t, c) => t + c.totalCost, 0).toFixed(2)
            const totalMarketValue = +investments.value.reduce((t, c) => t + c.totalMarketValue, 0).toFixed(2)
            const worth = +(totalMarketValue - totalCost).toFixed(2)
            const x = totalCost != 0 ? +(totalMarketValue / totalCost).toFixed(2) : 0
            const totalQuantity = investments.value.reduce((t, c) => t + c.quantity, 0)
            return { totalCost, totalMarketValue, worth, x, totalQuantity }
        })

        return (
            <div className="investment-stats">
                <div>
                    <i className="fa-solid fa-hand-holding-dollar" />
                    <span>{investmentStats.value.totalCost}</span>
                    <ToolTip content="Total Cost" />
                </div>
                <span className="divider" />
                <div>
                    <i className="fa-solid fa-vault" />
                    <span>{investmentStats.value.totalMarketValue}</span>
                    <ToolTip content="Total Market Value" />
                </div>
                <span className="divider" />
                <div>
                    <i className="fa-solid fa-money-bill-trend-up" />
                    <span style={{ color: investmentStats.value.x > 1 ? green : investmentStats.value.x < 1 ? red : '' }}>
                        {`${investmentStats.value.worth} (${investmentStats.value.x}x)`}
                    </span>
                    <ToolTip content="Worth" />
                </div>
                <span className="divider" />
                <div>
                    <i className="fa-solid fa-boxes-stacked" />
                    <span>{investmentStats.value.totalQuantity}</span>
                    <ToolTip content="Total Quantity" />
                </div>
            </div>
        )
    }

    const InvestmentsTable = () => {
        const windowWidth = window.innerWidth

        const onClickThreeDotBtn = (index) => {
            investmentItemDetails.value = investments.value[index]
            document.querySelector('body').style.overflow = 'hidden'
        }

        let fields = [
            { fields: [{ name: 'image', type: 'image', path: 'name' }] },
            { fields: [{ name: 'name', type: 'text', sortable: true }] },
            { fields: [{ name: 'quantity', type: 'number', sortable: true }] },
            { fields: [{ name: 'avgCost', type: 'number', sortable: true }] },
            { fields: [{ name: 'marketPrice', type: 'number', sortable: true }] },
            { fields: [{ name: 'worth', type: 'number', sortable: true, highlightBaseline: 0 }] },
            { fields: [{ name: 'x', type: 'number', template: '_rx', sortable: true, highlightBaseline: 1 }] },
            { fields: [{ name: 'currentTotalCost', type: 'number', sortable: true }] },
            { fields: [{ name: 'totalMarketValue', type: 'number', sortable: true }] },
            { fields: [{ name: 'button', type: 'button', className: 'fa-solid fa-ellipsis-vertical', onClick: onClickThreeDotBtn }] }
        ]

        if (windowWidth < 421) {
            fields.splice(1, 2)
            fields.splice(3, 1)
            fields.splice(4, 2)
        }

        return (
            <>
                {investments.value.length > 0 && <Table data={investments} sortState={sortValue} calculate={false} fields={fields} />}
            </>
        )
    }

    const Filters = () => {
        const types = ['Sticker', 'Capsule']
        const eventNames = ['Copenhagen 2024', 'Paris 2023', 'Rio 2022', 'Antwerp 2022', 'Stockholm 2021', '2020 RMR']
        const variants = ['Paper', 'Glitter', 'Holo', 'Foil', 'Gold', 'Lenticular']

        return (
            <div className="filters" style={{ display: showFilters.value ? '' : 'none' }}>
                <CustomSelect id="type" title="Type" state={type} options={types} func={() => sortValue.value = { name: 'x', value: false }} />
                <CustomSelect id="eventName" title="Event Name" state={eventName} options={eventNames} func={() => sortValue.value = { name: 'x', value: false }} />
                <CustomSelect id="variant" title="Variant" state={variant} options={variants} func={() => sortValue.value = { name: 'x', value: false }} />
                <button className="btn-secondary" onClick={() => batch(() => { type.value = 'Any'; eventName.value = 'Any'; variant.value = 'Any' })}><i className="fa-solid fa-filter-circle-xmark" /></button>
            </div>
        )
    }

    if (!user.value) return <span className="page-msg-box">Please log in to view investments</span>

    return (
        <div className="investments-page container">
            <div className="stats-and-controls">
                <InvestmentStats />
                <div className="header-buttons">
                    {user.value.investments.length != 0 && <button className="btn-secondary" onClick={() => showFilters.value = !showFilters.value}><i className="fa-solid fa-filter" /></button>}
                    <button className="btn" onClick={() => { showAddInvestmentSection.value = true; changeBodyOverflow('hidden') }}>Add Investment</button>
                </div>
                <Filters />
            </div>
            <section>
                <InvestmentsTable />
            </section>
            <InvestmentItemDetails />
            <AddInvestmentSection />
        </div>
    )
}