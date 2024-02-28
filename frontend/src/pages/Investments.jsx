import { batch, useSignal } from "@preact/signals-react"
import { dynamicTitle, usePostRequest } from "../utils"
import { useParams } from 'react-router-dom'
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"
import MessageBox from "../components/MessageBox";
import CustomSelect from "../components/CustomSelect";

export default function Investments({ user }) {
    dynamicTitle(window.location.pathname.slice(1))

    const { username } = useParams()
    const { blue, green, red, events } = useSelector(state => state.slice)
    const queryClient = useQueryClient();

    const itemStatus = useSignal('Active')
    const stickerType = useSignal('All')
    const itemType = useSignal('All')
    const eventName = useSignal('All')

    const pageMsg = useSignal('')
    const sortNumber = useSignal(6)
    const showFilters = useSignal(false)
    const investmentStats = useSignal(false)
    const selectedInvestmentItem = useSignal({})
    const purchaseSaleFormMsg = useSignal('')
    const investmentsMarketPriceUpdateProcess = useSignal(false)
    const stopUpdateInvestmentsMarketPrice = useSignal(false)
    const refetchInvesetmentsTrigger = useSignal(false)

    const showAddInvestmentForm = useSignal(false)
    const addInvestmentFormMsg = useSignal('')
    const sendingAddInvestmentFormData = useSignal(false)

    const addInvestmentItem = async (e) => {
        e.preventDefault()
        sendingAddInvestmentFormData.value = true

        let { name, buyPrice, quantity, date, dateCb } = e.target

        if (quantity.value == '' || +quantity.value < 1) addInvestmentFormMsg.value = 'Quantity might be more than 0'
        else {
            let _date = dateCb.checked ? new Date() : new Date(date.value) == 'Invalid Date' ? new Date() : new Date(date.value)
            let reqBody = { userId: user.value._id, name: name.value, buyPrice: buyPrice.value, quantity: quantity.value, date: _date }
            let postReqBody = await usePostRequest('/add-investment', reqBody)

            if (postReqBody.success) {
                e.target.reset()
                batch(() => {
                    user.value = postReqBody.user
                    addInvestmentFormMsg.value = ''
                    showAddInvestmentForm.value = false
                    sendingAddInvestmentFormData.value = false
                    refetchInvesetmentsTrigger.value = !refetchInvesetmentsTrigger.value
                })
            }
            else {
                batch(() => {
                    addInvestmentFormMsg.value = postReqBody.msg
                    sendingAddInvestmentFormData.value = false
                })
            }
        }
    }

    const deleteInvestmentItem = async (itemId) => {
        if (confirm('Are you sure you want delete the investment item ?') == false || !user.value || user.value.username != username || !selectedInvestmentItem.value.name) return false
        stopUpdateInvestmentsMarketPrice.value = true

        let _delete = await usePostRequest('/delete-investment-item', { userId: user.value._id, itemId })
        if (_delete.success) {
            batch(() => {
                user.value = _delete.user
                selectedInvestmentItem.value = {}
                refetchInvesetmentsTrigger.value = !refetchInvesetmentsTrigger.value
            })
        }
    }

    const purchaseSaleInvestmentItem = async (e) => {
        e.preventDefault()

        let { price, quantity, date, dateCb, actionType } = e.target

        if (!user.value || user.value.username != username || !selectedInvestmentItem.value.name) return false
        else if (!/^[0-9.,]+$/.test(price.value)) purchaseSaleFormMsg.value = 'Invalid price'
        else if (quantity <= 0) purchaseSaleFormMsg.value = 'Quantity might be more than 0'
        else if (!/^[0-9]+$/.test(quantity.value)) purchaseSaleFormMsg.value = 'Invalid quantity'
        else if (actionType.value == -1) purchaseSaleFormMsg.value = 'You did not chosose action type'
        else {
            let _date = dateCb.checked ? new Date() : new Date(date.value) == 'Invalid Date' ? new Date() : new Date(date.value)
            let reqBody = { userId: user.value._id, itemId: selectedInvestmentItem.value._id, price: price.value, quantity: quantity.value, date: _date, actionType: actionType.value }
            let update = await usePostRequest('/add-purchase-sale', reqBody)

            if (update.success) {
                e.target.reset()
                batch(() => {
                    user.value = update.user
                    stopUpdateInvestmentsMarketPrice.value = true
                    purchaseSaleFormMsg.value = ''
                    selectedInvestmentItem.value = {}
                    refetchInvesetmentsTrigger.value = !refetchInvesetmentsTrigger.value
                })
            }
            else purchaseSaleFormMsg.value = update.msg || 'Action failed'
        }
    }

    const InvestmentsSection = () => {
        const getInvestments = async () => {
            let _investments = []

            if (user.value.username == username) {
                if (user.value.investments.length == 0) return []
                _investments = user.value.investments
            }
            else {
                let getUser = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/get-user/${username}`).then(res => res.json())

                if (getUser.msg == 'User could not found') { pageMsg.value = 'User could not found'; return false }
                else {
                    if (getUser.user.accountSettings.investmentVisibility) _investments = getUser.user.investments.filter(item => item.status == 1)
                    else { pageMsg.value = 'Investments private'; return false }
                }
            }

            let _tags = [stickerType.value, itemType.value, eventName.value].filter(item => item != 'All')
            _investments = _investments.filter(item => item.status == (itemStatus.value == 'Active' ? 1 : 0)).filter(item => _tags.every(tag => item.tags.slice(1).includes(tag)))

            for (let i in _investments) {
                let item = _investments[i]

                if (item.status == 1) {
                    item.cost = +(item.buyPrice * item.quantity).toFixed(2)
                    item.value = +(item.marketPrice * item.quantity).toFixed(2)
                    item.worth = [+(item.marketPrice / item.buyPrice), +(item.marketPrice - item.buyPrice).toFixed(3)]
                }
                else if (item.status == 0) {
                    item.cost = item.actionHistory.slice().filter(item => item.actionType == 1).reduce((t, c) => { return t + (c.price * c.quantity) }, 0)
                    item.value = item.actionHistory.slice().filter(item => item.actionType == 0).reduce((t, c) => { return t + (c.price * c.quantity) }, 0) // represents total sales
                    item.quantity = item.actionHistory.slice().filter(item => item.actionType == 1).reduce((t, c) => { return t + c.quantity }, 0) // represents total buy amount
                    item.buyPrice = item.cost / item.quantity
                    item.totalWorth = [...item.totalWorth, +(item.totalWorth[0] / item.cost).toFixed(2), +(item.totalWorth[1] / item.cost).toFixed(2)]
                }
            }

            let totalCost = +_investments.reduce((t, c) => { return t + c.cost }, 0).toFixed(2)
            let totalValue = +_investments.reduce((t, c) => { return t + c.value }, 0).toFixed(2)
            let worth = [+(totalValue - totalCost).toFixed(2), (totalValue / totalCost).toFixed(2)]

            batch(() => {
                sortNumber.value = 6
                investmentStats.value = { totalCost, totalValue, worth }
            })
            let sortKey = itemStatus.value == 'Active' ? 'worth' : 'totalWorth'
            return _investments.sort((a, b) => b[sortKey][0] - a[sortKey][0])
        }

        const { data: investments } = useQuery({
            queryFn: async () => await getInvestments(),
            queryKey: ['investments', refetchInvesetmentsTrigger.value, itemStatus.value, itemType.value, stickerType.value, eventName.value],
            staleTime: Infinity,
            gcTime: 0
        })

        const { mutate: sortInvestments } = useMutation({
            mutationFn: () => {
                let sortedInvestments = []
                let keyForSortByWorth = itemStatus.value == 'Active' ? 'worth' : 'totalWorth'

                if (sortNumber == 1 || sortNumber == 2) sortedInvestments = investments.sort((a, b) => b.buyPrice - a.buyPrice)
                else if (sortNumber == 3 || sortNumber == 4) sortedInvestments = investments.sort((a, b) => b.quantity - a.quantity)
                else if (sortNumber == 5 || sortNumber == 6) sortedInvestments = investments.sort((a, b) => b[keyForSortByWorth][0] - a[keyForSortByWorth][0])
                else if (sortNumber == 7 || sortNumber == 8) sortedInvestments = investments.sort((a, b) => b.cost - a.cost)
                else if (sortNumber == 9 || sortNumber == 10) sortedInvestments = investments.sort((a, b) => b.value - a.value)

                if (sortNumber % 2 == 1) sortedInvestments = sortedInvestments.reverse()

                sortedInvestments = sortedInvestments.filter(item => item.tags.includes('Sticker'))

                return sortedInvestments
            },
            onSuccess: (data) => { queryClient.setQueryData('investments', data) }
        })

        return (
            <div className="investments template-style-wrapper">
                <div className="field-names">
                    <span className="image">Img</span>
                    <span className="field-names-item item-name">Item Name</span>
                    <span className="field-names-item buy-price">
                        <span style={{ color: sortNumber == 1 || sortNumber == 2 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 2 ? 1 : 2; sortInvestments() }}>
                            Buy Price
                        </span>
                    </span>
                    <span className="field-names-item quantity">
                        <span style={{ color: sortNumber == 3 || sortNumber == 4 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 4 ? 3 : 4; sortInvestments() }}>
                            Quantity
                        </span>
                    </span>
                    <span className="field-names-item market-price">
                        <span style={{ color: sortNumber == 5 || sortNumber == 6 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 6 ? 5 : 6; sortInvestments() }}>
                            {itemStatus.value == 'Active' ? 'Market Price (Worth)' : 'Net Worth'}
                        </span>
                    </span>
                    <span className="field-names-item cost">
                        <span style={{ color: sortNumber == 7 || sortNumber == 8 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 8 ? 7 : 8; sortInvestments() }}>
                            Cost
                        </span>
                    </span>
                    <span className="field-names-item value">
                        <span style={{ color: sortNumber == 9 || sortNumber == 10 ? blue : '' }} onClick={() => { sortNumber.value = sortNumber == 10 ? 9 : 10; sortInvestments() }}>
                            {itemStatus.value == 'Active' ? 'Value' : 'Total Sale'}
                        </span>
                    </span>
                </div>
                {investments && investments.map((investment, index) =>
                    <div className="item-div" key={index}>
                        <img className="image" src={'https://api.steamapis.com/image/item/730/' + investment.name} onClick={() => { if (user.value.username == username) selectedInvestmentItem.value = investment }} />
                        <span className="item-div-children item-name">{investment.name}</span>
                        <span className="item-div-children buy-price">{+investment.buyPrice.toFixed(3)}</span>
                        <span className="item-div-children quantity">{investment.quantity}</span>
                        {itemStatus.value == 'Active' ?
                            <span className="item-div-children market-price">
                                <span>{investment.marketPrice}</span>
                                <span style={{ color: investment.worth[1] > 0 ? green : investment.worth[1] == 0 ? '' : red }}>
                                    {`(${investment.worth[0].toFixed(2)}x ${investment.worth[1] >= 0 ? '+' : ''}${investment.worth[1]})`}
                                </span>
                            </span> : <span className="item-div-children market-price">
                                <span>{+investment.totalWorth[1].toFixed(3)}</span>
                                <span style={{ color: investment.totalWorth[3] > 0 ? green : investment.totalWorth[3] == 0 ? '' : red }}>{`${investment.totalWorth[3]}x`}</span>
                            </span>
                        }
                        <span className="item-div-children cost">{investment.cost}</span>
                        <span className="item-div-children value">{investment.value}</span>
                    </div>
                )}
            </div>
        )
    }

    const InvestmentDetailsDiv = () => {
        return (
            <div className="investment-item-details-div" style={{ transform: selectedInvestmentItem.value.buyPrice ? 'translateX(0)' : '' }}>
                <div className="investment-item-details-div-inner-div">
                    <div className="buttons">
                        <button className="delete-btn" onClick={() => deleteInvestmentItem(selectedInvestmentItem.value._id)}><i className="fa-regular fa-trash-can" /></button>
                        <button className="close-btn" onClick={() => selectedInvestmentItem.value = {}}><i className="fa-solid fa-x" /></button>
                    </div>
                    {selectedInvestmentItem.value.name && <div className="investment-item-informations">
                        <img className="image" src={'https://api.steamapis.com/image/item/730/' + selectedInvestmentItem.value.name} />
                        <div className="item-name">{selectedInvestmentItem.value.name}</div>
                        <div>
                            <span>Buy Price</span>
                            <span>{+selectedInvestmentItem.value.buyPrice.toFixed(3)}</span>
                        </div>
                        <div>
                            <span>Quantity</span>
                            <span>{selectedInvestmentItem.value.quantity}</span>
                        </div>
                        {selectedInvestmentItem.value.status == 1 && <div>
                            <span>Market Price</span>
                            <span>{selectedInvestmentItem.value.marketPrice}</span>
                        </div>}
                        {selectedInvestmentItem.value.worth && <div>
                            <span>Worth</span>
                            <span style={{ color: selectedInvestmentItem.value.worth[1] > 0 ? green : selectedInvestmentItem.value.worth[1] == 0 ? '' : red }}>
                                {`(${selectedInvestmentItem.value.worth[0].toFixed(2)}x ${selectedInvestmentItem.value.worth[1] > 0 ? '+' : ''}${selectedInvestmentItem.value.worth[1]})`}
                            </span>
                        </div>}
                        <div>
                            <span>Total Cost</span>
                            <span>{selectedInvestmentItem.value.cost}</span>
                        </div>
                        <div>
                            <span>{selectedInvestmentItem.value.status == 1 ? 'Total Value' : 'Total Sale'}</span>
                            <span>{selectedInvestmentItem.value.value}</span>
                        </div>
                        {selectedInvestmentItem.value.totalWorth[0] != 0 && <div>
                            <span>Total Worth</span>
                            <span style={{ color: selectedInvestmentItem.value.totalWorth[0] > 0 ? green : selectedInvestmentItem.value.totalWorth[0] == 0 ? '' : red }}>
                                {+selectedInvestmentItem.value.totalWorth[0].toFixed(3) + (selectedInvestmentItem.value.totalWorth.length > 2 && ` (${selectedInvestmentItem.value.totalWorth[2]}x)`)}
                            </span>
                        </div>}
                        {selectedInvestmentItem.value.totalWorth[0] != 0 && <div>
                            <span>Total Net Worth</span>
                            <span style={{ color: selectedInvestmentItem.value.totalWorth[1] > 0 ? green : selectedInvestmentItem.value.totalWorth[1] == 0 ? '' : red }}>
                                {+selectedInvestmentItem.value.totalWorth[1].toFixed(3) + (selectedInvestmentItem.value.totalWorth.length > 2 && ` (${selectedInvestmentItem.value.totalWorth[3]}x)`)}
                            </span>
                        </div>}
                    </div>}
                    {selectedInvestmentItem.value.actionHistory &&
                        <div className="action-history">
                            <div className="action-history-title">
                                Action History
                            </div>
                            <div className="action-history-field-names">
                                <span>Action Type</span>
                                <span>Price</span>
                                <span>Quantity</span>
                                <span>Date</span>
                            </div>
                            {selectedInvestmentItem.value.actionHistory.map((action, index) =>
                                <div className="action-history-item" key={index}>
                                    <span style={{ color: action.actionType == 1 ? green : red }}>{action.actionType == 1 ? 'purchase' : 'sale'}</span>
                                    <span>{action.price}</span>
                                    <span>{action.quantity}</span>
                                    <span>{action.date.slice(0, 10).split('-').reverse().join('.')}</span>
                                </div>
                            )}
                        </div>
                    }
                    <form id="purchase-sale-form" className="form" onSubmit={purchaseSaleInvestmentItem}>
                        <div className="form-header-div">
                            <h3 className="form-header">Add Purchase Sale</h3>
                        </div>
                        <div className="form-body">
                            <div className="form-body-item">
                                <span>Price</span>
                                <input name="price" type="text" />
                            </div>
                            <div className="form-body-item">
                                <span>Quantity</span>
                                <input name="quantity" type="number" />
                            </div>
                            <div className="form-body-item">
                                <span>Date</span>
                                <input name="date" type="date" max={new Date().toISOString().split('T')[0]} />
                                <label htmlFor="dateCb2">
                                    <span>Use today's date as date</span>
                                    <input id="dateCb2" name="dateCb" type="checkbox" defaultChecked={true} />
                                </label>
                            </div>
                            <div className="form-body-item action-type">
                                <span>Action Type</span>
                                <select name="actionType">
                                    <option value={-1}>Select Action Type</option>
                                    <option value={1}>Purchase</option>
                                    <option value={0}>Sale</option>
                                </select>
                            </div>
                            <span className="form-msg">{purchaseSaleFormMsg}</span>
                            <button className="submit-btn" type="sumbit">Add</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    const AddInvestmentFormContainer = () => {
        return (
            <div className="add-investment-form-container" style={{ transform: showAddInvestmentForm.value ? 'translateX(0)' : '' }}>
                <button className="close-btn" onClick={() => showAddInvestmentForm.value = false}><i className="fa-solid fa-xmark" /></button>
                <form id="add-investment-form" className="form" onSubmit={addInvestmentItem}>
                    <div className="form-header-div">
                        <h3 className="form-header">Add Investment</h3>
                    </div>
                    <div className="form-body">
                        <div className="form-body-item">
                            <span>Item Name</span>
                            <input name="name" type="text" />
                        </div>
                        <div className="form-body-item">
                            <span>Buy Price</span>
                            <input name="buyPrice" type="text" />
                        </div>
                        <div className="form-body-item">
                            <span>Quantity</span>
                            <input name="quantity" type="number" />
                        </div>
                        <div className="form-body-item">
                            <span>Date</span>
                            <input name="date" type="date" max={new Date().toISOString().split('T')[0]} />
                            <label htmlFor="dateCb">
                                <span>Use today's date as date</span>
                                <input id="dateCb" name="dateCb" type="checkbox" defaultChecked={true} />
                            </label>
                        </div>
                        <span className="form-msg">{addInvestmentFormMsg}</span>
                        <button className="submit-btn" type="submit" disabled={sendingAddInvestmentFormData.value}>Add Investment</button>
                    </div>
                </form>
            </div>
        )
    }

    const InvestmentsMarketPriceUpdateInfoDiv = () => {
        useEffect(() => {
            if (!user.value || user.value.username != username || user.value.investments.slice().filter(item => item.status == 1).length == 0 || stopUpdateInvestmentsMarketPrice.value ||
                (new Date() - new Date(user.value.accountInformations.lastInvestmentsMarketPriceUpdateDate) < 1000 * 60 * 30)) return () => false

            let _investments = user.value.investments.slice(0).filter(item => item.status == 1)
            let i = 0
            investmentsMarketPriceUpdateProcess.value = 'active'

            const updateInvestmentsMarketPrice = async () => {
                let update = await usePostRequest('/update-investment-item-market-price', { userId: user.value._id, name: _investments[i].name, index: i, length: _investments.length })

                if (update.success) {
                    investmentsMarketPriceUpdateProcess.value = (Number(i) + 1) + '/' + _investments.length

                    if (i == _investments.length - 1) {
                        clearInterval(myInterval)
                        investmentsMarketPriceUpdateProcess.value = false

                        let updateInvestmentsValueHistory = await usePostRequest('/update-investments-value-history', { userId: user.value._id, date: new Date() })
                        if (updateInvestmentsValueHistory.success) {
                            batch(() => {
                                user.value = updateInvestmentsValueHistory.user
                                stopUpdateInvestmentsMarketPrice.value = false
                                refetchInvesetmentsTrigger.value = !refetchInvesetmentsTrigger.value
                            })
                        }
                    }
                    i++
                }
                else {
                    clearInterval(myInterval)
                    investmentsMarketPriceUpdateProcess.value = update.msg || 'error'
                }
            }

            const myInterval = setInterval(updateInvestmentsMarketPrice, 3100)
            return () => clearInterval(myInterval)
        }, [stopUpdateInvestmentsMarketPrice.value])

        return (
            <>
                {investmentsMarketPriceUpdateProcess.value && <div className="market-price-update-info-div" style={{ animation: stopUpdateInvestmentsMarketPrice.value ? 'none' : '' }}>
                    <i className="fa-brands fa-steam" />
                    {(investmentsMarketPriceUpdateProcess.value && stopUpdateInvestmentsMarketPrice.value) && <i className="fa-solid fa-rotate-right" onClick={() => stopUpdateInvestmentsMarketPrice.value = false} />}
                    {(investmentsMarketPriceUpdateProcess.value && !stopUpdateInvestmentsMarketPrice.value) &&
                        <i className="fa-solid fa-x" onClick={() => stopUpdateInvestmentsMarketPrice.value = true} />}
                    <span>{stopUpdateInvestmentsMarketPrice.value ? 'canceled' : investmentsMarketPriceUpdateProcess}</span>
                    <span className="tool-tip">Investments market price update</span>
                </div>}
            </>
        )
    }

    const InvestmentStats = () => {
        return (
            investmentStats.value && <div className="investment-stats">
                <span className="investment-stats-item">
                    <i className="fa-solid fa-hand-holding-dollar" />
                    <span>{investmentStats.value.totalCost}</span>
                    <span className="tool-tip">Total Cost</span>
                </span>
                <span className="investment-stats-item">
                    <i className="fa-solid fa-vault" />
                    <span>{investmentStats.value.totalValue}</span>
                    <span className="tool-tip">{itemStatus.value == 'Active' ? 'Total Value' : 'Total Sale'}</span>
                </span>
                <span className="investment-stats-item">
                    <i className="fa-solid fa-money-bill-trend-up" />
                    <span style={{ color: investmentStats.value.worth[0] > 0 ? green : investmentStats.value.worth[0] == 0 ? '' : red }}>{`${investmentStats.value.worth[0]} (${investmentStats.value.worth[1]}x)`}</span>
                    <span className="tool-tip">Worth</span>
                </span>
            </div>
        )
    }

    const FiltersSection = () => {
        return (
            showFilters.value && <div className="filters-section">
                <CustomSelect id={'itemStatus'} title={'Choose Item Status'} state={itemStatus} options={['Active', 'Sold']} width={'10rem'} />
                <CustomSelect id={'itemType'} title={'Choose Item Type'} state={itemType} width={'12rem'}
                    options={['All', 'Capsule', 'Sticker', 'Gloves', 'Knife', 'Souvenir-Package', 'Case', 'Patch', 'Agent', 'Music-Kit', 'Pass', 'Pin', 'Graffiti', 'Skin']} />
                <CustomSelect id={'stickerType'} title={'Choose Sticker Type'} state={stickerType} options={['All', 'Paper', 'Glitter', 'Holo', 'Foil', 'Gold', 'Lenticular']} width={'10rem'} />
                <CustomSelect id={'eventName'} title={'Choose Event'} state={eventName} width={'10rem'}
                    options={['All', ...events.filter(item => item.eventType == 'tournament').map(item => { return item.name })]} />
            </div>
        )
    }

    return (
        <div className="investments-page container">
            {pageMsg == 'Investments private' ? <MessageBox text='This page is private' /> : pageMsg == 'User could not found' ? <MessageBox text='User could not found' /> : <>
                <InvestmentDetailsDiv />
                <div className="top-div">
                    <InvestmentStats />
                    <InvestmentsMarketPriceUpdateInfoDiv />
                    {user.value.username == username && <div className="buttons">
                        <button className="filter-btn" onClick={() => showFilters.value = !showFilters.value}>
                            <i className="fa-solid fa-filter" />
                        </button>
                        <button className="btn add-investment-btn" onClick={() => { batch(() => { showAddInvestmentForm.value = true, stopUpdateInvestmentsMarketPrice.value = true }) }}>
                            <i className="fa-solid fa-plus" />
                            <span>Add Investment</span>
                        </button>
                    </div>}
                </div>
                <FiltersSection />
                <InvestmentsSection />
                <AddInvestmentFormContainer />
            </>}</div>
    )
}