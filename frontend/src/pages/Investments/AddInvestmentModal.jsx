import { batch, useSignal } from '@preact/signals-react';
import { big, usePostRequest } from '../../utils';
import { useRef } from 'react';
import Papaparse from 'papaparse'
import HeaderWithIcon from '../../components/HeaderWithIcon';
import Form from '../../components/Form';
import Table from '../../components/Table';
import Bubbles from '../../components/Bubbles';

export default function AddInvestmentModal({ showAddInvestmentModal, user, setBodyOverflow }) {
    const selectedMethod = useSignal(null)
    const processedCsvFileData = useSignal(null)
    const addInvestmentFormMsg = useSignal(null)
    const addInvestmentFromCsvFileMsg = useSignal(null)
    const confirmCsvFileItemsBtn = useRef(null)

    const convertMilliseconds = (ms) => {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000).toFixed(0)
        return [minutes > 0 ? `${minutes} minute${minutes != 1 ? 's' : ''}` : null, seconds > 0 ? `${seconds} second${seconds != 1 ? 's' : ''}` : null].filter(Boolean).join(' ')
    }

    const addInvestmentManually = async (e) => {
        e.preventDefault()

        let { itemName: { value: name }, avgCost: { value: avgCost }, quantity: { value: quantity }, date: { value: date } } = e.target

        if (name == '') addInvestmentFormMsg.value = 'Name cannot be empty.'
        else if (+avgCost <= 0) addInvestmentFormMsg.value = 'Purchase price must be greater than 0.'
        else if (+quantity <= 0) addInvestmentFormMsg.value = 'Quantity must be greater than 0.'
        else {
            const response = await usePostRequest('add-investment', { userId: user.value._id, token: document.cookie, items: [{ name, avgCost, quantity, date }] })
            if (!response.success) return addInvestmentFormMsg.value = response.msg

            batch(() => {
                addInvestmentFormMsg.value = null
                selectedMethod.value = null
                showAddInvestmentModal.value = false
                user.value = response.user
            })
            setBodyOverflow('auto')
        }
    }

    const addInvestmentFromCsvFile = async () => {
        if (!processedCsvFileData.value?.length) return;

        confirmCsvFileItemsBtn.current.disabled = true;
        addInvestmentFromCsvFileMsg.value = `This process will take approximately ${convertMilliseconds(processedCsvFileData.value.length * 3200)} to complete.`

        const response = await usePostRequest('add-investment', { userId: user.value._id, token: document.cookie, items: processedCsvFileData.value })

        confirmCsvFileItemsBtn.current.disabled = false

        if (!response.success) return addInvestmentFromCsvFileMsg.value = response.msg

        batch(() => {
            addInvestmentFromCsvFileMsg.value = null
            selectedMethod.value = null
            showAddInvestmentModal.value = false
            user.value = response.user
            processedCsvFileData.value = null
        })
        setBodyOverflow('auto')
    }

    const processCsvFileData = (file) => {
        Papaparse.parse(file, {
            header: true, dynamicTyping: true, complete: (results) => {
                const filteredItems = results.data.filter(item => item[' App Id'] == 730 && item[' Type'] == 'purchase' && item[' Display Price'].slice(-3) == 'USD')

                const groupedItems = filteredItems.reduce((acc, item) => {
                    if (!item[' Market Name'] || !item[' Display Price']) return alert(`Invalid CSV format. Missing "Market Name" or "Display Price" in rows.`)

                    const name = item[' Market Name']
                    const price = +item[' Display Price'].slice(1, -4)
                    const existingItem = acc.find(entry => entry.name == name)

                    if (existingItem) {
                        existingItem.quantity = +big(existingItem.quantity).plus(1)
                        existingItem.totalCost = +big(existingItem.totalCost).plus(price)
                    }
                    else acc.push({ name, quantity: 1, totalCost: price })

                    return acc
                }, [])

                processedCsvFileData.value = groupedItems.map(item => { item.avgCost = +big(item.totalCost).div(item.quantity); return item })
            }
        })
    }

    const deleteItemFromTable = (itemIndex) => processedCsvFileData.value = processedCsvFileData.value.filter((_, index) => index != itemIndex)
    
    const AddInvestmentFromCsvFileMsg = () => addInvestmentFromCsvFileMsg.value && <span className="add-investment-by-csv-file-msg">{addInvestmentFromCsvFileMsg.value}</span>

    const MethodSelector = () => {
        return (
            <div className="methods">
                <button className={'btn-secondary' + (selectedMethod.value == 'manually' ? ' btn-secondary-active' : '')} onClick={() => selectedMethod.value = 'manually'}>
                    <i className="fa-brands fa-wpforms" />
                    <span>Manually</span>
                </button>
                <button className={'btn-secondary' + (selectedMethod.value == 'csv' ? ' btn-secondary-active' : '')} onClick={() => selectedMethod.value = 'csv'}>
                    <i className="fa-solid fa-file-csv" />
                    <span>Import Csv File</span>
                </button>
                {selectedMethod.value == 'csv' &&
                    <label className="import-csv-file-label" onDrop={(e) => { e.preventDefault(); processCsvFileData(e.dataTransfer.files[0]) }} onDragOver={(e) => e.preventDefault()} >
                        <i className="fa-solid fa-file-import" />
                        <span>Import File</span>
                        <input id="import-csv-file-input" type="file" accept=".csv" onChange={(e) => processCsvFileData(e.target.files[0])} />
                    </label>
                }
                {(selectedMethod.value == 'csv' && processedCsvFileData.value?.length > 0) &&
                    <button className="btn confirm-csv-file-items-btn" ref={confirmCsvFileItemsBtn} onClick={() => addInvestmentFromCsvFile()}>
                        <span>Confirm Csv File Items</span>
                        <Bubbles />
                    </button>
                }
                <AddInvestmentFromCsvFileMsg />
            </div>
        )
    }

    const AddInvestmentContent = () => {
        if (selectedMethod.value == 'manually') {
            return <div className="form-wrapper">
                <Form title="Add Investment" submitFunction={addInvestmentManually} formMsgState={addInvestmentFormMsg} submitBtnInnerText="Add Investment"
                    fields={[
                        { align: 'column', fields: [{ name: 'itemName', type: 'text' }, { name: 'avgCost', type: 'number', isStepAllowed: true }, { name: 'quantity', type: 'number' }, { name: 'date', type: 'date' }] }
                    ]} />
            </div>
        }
        else if (selectedMethod.value == 'csv' && processedCsvFileData.value?.length > 0) {
            return <div className="table-wrapper">
                <Table data={processedCsvFileData}
                    columns={[
                        { fields: [{ label: 'image', type: 'image', path: 'name' }] },
                        { fields: [{ label: 'name', type: 'text' }] },
                        { fields: [{ label: 'avgCost', type: 'number' }] },
                        { fields: [{ label: 'quantity', type: 'number' }] },
                        { fields: [{ label: 'totalCost', type: 'number' }] },
                        { fields: [{ label: 'button', type: 'button', className: 'fa-regular fa-trash-can', onClick: deleteItemFromTable }] }
                    ]} />
            </div>
        }
        else return null
    }

    if (!showAddInvestmentModal.value) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-container container">
                <div className="add-investment-modal modal">

                    <div className="modal-header">
                        <HeaderWithIcon title="Add Investment" iconClass="fa-solid fa-plus" />
                        <i className="close-btn fa-solid fa-xmark" onClick={() => { showAddInvestmentModal.value = false; setBodyOverflow('auto') }} />
                    </div>

                    <MethodSelector />

                    <span className="horizontal-divider" />

                    <AddInvestmentContent />

                </div>
            </div>
        </div>
    )
}