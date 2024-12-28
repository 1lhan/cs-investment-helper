import { batch, useSignal } from '@preact/signals-react';
import { formatDate, splitCamelCase, usePostRequest } from '../../utils';

export default function InvestmentItemModal({ item, user, setBodyOverflow }) {
    const transactionFormMsg = useSignal(null)
    
    const saveTransaction = async (e) => {
        e.preventDefault()

        let { price: { value: price }, quantity: { value: quantity }, date: { value: date }, transactionType: { value: transactionType } } = e.target

        if (+price <= 0) transactionFormMsg.value = 'Price must be greater than 0.'
        else if (+quantity <= 0) transactionFormMsg.value = 'Quantity must be greater than 0.'
        else if (transactionType == '') transactionFormMsg.value = 'You must select a transaction type.'
        else {
            const response = await usePostRequest('save-transaction', { itemId: item.value._id, userId: user.value._id, token: document.cookie, price, quantity, date, transactionType })
            if (!response.success) return transactionFormMsg.value = response.msg

            batch(() => {
                user.value = response.user
                transactionFormMsg.value = null
                item.value = null
            })
            setBodyOverflow('auto')
        }
    }

    const undoLastUpdate = async () => {
        if (!item.value.lastUpdate) return alert('There is no last update data for this investment item.')
        if (!confirm('Are you sure you want to undo the last update?')) return;

        const response = await usePostRequest('undo-last-update', { itemId: item.value._id, userId: user.value._id, token: document.cookie })
        if (!response.success) return alert(response.msg)

        batch(() => {
            item.value = null
            user.value = response.user
        })
        setBodyOverflow('auto')
    }

    const deleteInvestmentItem = async () => {
        if (!confirm(`Are you sure you want to delete the investment item? \n${item.value.name}`)) return;

        const response = await usePostRequest('delete-investment-item', { itemId: item.value._id, userId: user.value._id, token: document.cookie })
        if (!response.success) return alert(response.msg)

        batch(() => {
            item.value = null
            user.value = response.user
        })
        setBodyOverflow('auto')
    }

    const renderField = (field, fieldIndex) => {
        return <div key={fieldIndex}>
            <span>{splitCamelCase(field)}</span>
            <span>{+item.value[field].toFixed(3)}</span>
        </div>
    }

    const getProfitClass = (value, highlightBaseline) => value > highlightBaseline ? 'green' : value < highlightBaseline ? 'red' : ''

    const TransactionFormMsg = () => transactionFormMsg?.value && <span className="form-msg">{transactionFormMsg}</span>

    if (!item.value) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-container container">
                <div className="investment-item-modal modal">
                    <div className="modal-header">
                        <i className="close-btn fa-solid fa-xmark" onClick={() => { batch(() => { item.value = null; transactionFormMsg.value = null }); setBodyOverflow('auto') }} />
                    </div>
                    <div className="modal-body">

                        <div className="modal-body-item">
                            <img src={'https://api.steamapis.com/image/item/730/' + item.value.name} alt={item.value.name} />
                            <span className="item-name">{item.value.name}</span>

                            {['quantity', 'avgCost', 'marketPrice'].map((field, fieldIndex) => renderField(field, fieldIndex))}

                            <div>
                                <span>Profit</span>
                                <span className={getProfitClass(item.value.profit, 0)}>{`${item.value.profit} (${item.value.profitAsX}x)`}</span>
                            </div>

                            {['currentTotalCost', 'totalMarketValue', 'totalCost'].map((field, fieldIndex) => renderField(field, fieldIndex))}

                            {item.value.soldQuantity > 0 &&
                                <>
                                    <span className="horizontal-divider" />

                                    {['avgSalePrice', 'soldQuantity', 'totalSales'].map((field, fieldIndex) => renderField(field, fieldIndex))}

                                    <div>
                                        <span>Sales Profit</span>
                                        <span className={getProfitClass(item.value.salesProfit, 0)}>{+item.value.salesProfit.toFixed(3)}</span>
                                    </div>

                                    <div>
                                        <span>Net Sales Profit</span>
                                        <span className={getProfitClass(item.value.netSalesProfit, 0)}>{+item.value.netSalesProfit.toFixed(3)}</span>
                                    </div>
                                </>
                            }

                            <span className="horizontal-divider" />

                            <div>
                                <span>Initial Purchase Date</span>
                                <span>{formatDate(item.value.initialPurchaseDate)}</span>
                            </div>

                            <div>
                                <span>Tags</span>
                                <span>{item.value.tags.join(', ')}</span>
                            </div>

                            {item.value.lastUpdate &&
                                <>
                                    <span className="horizontal-divider" />
                                    <div>
                                        <span>Last Update Date</span>
                                        <span>{formatDate(item.value.lastUpdate.date)}</span>
                                    </div>
                                    <div>
                                        <span>{`Last Update ${item.value.lastUpdate.avgCost ? splitCamelCase('avgCost') : splitCamelCase('avgSalePrice')}`}</span>
                                        <span>{item.value.lastUpdate.avgCost || item.value.lastUpdate.avgSalePrice}</span>
                                    </div>
                                    <div>
                                        <span>{`Last Update ${item.value.lastUpdate.quantity ? 'quantity' : splitCamelCase('soldQuantity')}`}</span>
                                        <span>{item.value.lastUpdate.quantity || item.value.lastUpdate.soldQuantity}</span>
                                    </div>
                                </>
                            }
                        </div>

                        <div className="modal-body-item">
                            <form className="transaction-form" onSubmit={saveTransaction}>
                                <div className="form-body">
                                    <div className="fields-group row">
                                        <div className="fields-group-item">
                                            <span>Price</span>
                                            <input name="price" type="number" step="0.01" />
                                        </div>
                                        <div className="fields-group-item">
                                            <span>Quantity</span>
                                            <input name="quantity" type="number" />
                                        </div>
                                    </div>
                                    <div className="fields-group column">
                                        <div className="fields-group-item">
                                            <span>Date</span>
                                            <input name="date" type="date" />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-bottom">
                                    <label className="label-purchase">
                                        <input name="transactionType" type="radio" value="purchase" />
                                        <span>Purchase</span>
                                    </label>
                                    <label className="label-sale">
                                        <input name="transactionType" type="radio" value="sale" />
                                        <span>Sale</span>
                                    </label>
                                    <button className="btn" type="submit">
                                        <i className="fa-solid fa-check" />
                                    </button>
                                </div>
                                <TransactionFormMsg />
                            </form>

                            <div className="buttons">
                                <button className="btn-secondary undo-last-update-btn" onClick={() => undoLastUpdate()}>
                                    <i className="fa-solid fa-clock-rotate-left" />
                                    <span>Undo Last Update</span>
                                </button>
                                <button className="btn-secondary delete-investment-item-btn" onClick={() => deleteInvestmentItem()}>
                                    <i className="fa-regular fa-trash-can" />
                                    <span>Delete Investment Item</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}