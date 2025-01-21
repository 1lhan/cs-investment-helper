import { useComputed } from '@preact/signals-react'
import { NavLink } from 'react-router-dom'
import { big, formatDate, splitCamelCase } from '../utils'
import ToolTip from './ToolTip'

export default function Table({ data, sortState, calculate, columns }) {
    const renderField = (field, dataItem, fieldIndex, dataItemIndex) => {
        const { label, type, path, template, dateFormatOptions, className, onClick, highlightBaseline } = field
        const fieldKey = path || label
        let innerText = dataItem[fieldKey]

        if (innerText == null && type != 'button' && type != 'link') return null
        if (type == 'number') innerText = new Intl.NumberFormat(navigator.language, { maximumFractionDigits: 2 }).format(innerText).replaceAll(',', '.')
        if (type == 'date') innerText = formatDate(new Date(innerText), dateFormatOptions)
        if (template) innerText = template.replace('_r', innerText)

        if (type == 'image') return <img src={'https://api.steamapis.com/image/item/730/' + innerText} alt={innerText} key={fieldIndex} />
        else if (type == 'button') return <i className={className} onClick={() => onClick(dataItemIndex)} key={fieldIndex} />
        else if (type == 'link') return <NavLink to={'https://steamcommunity.com/market/listings/730/' + innerText} target="_blank" key={fieldIndex}><i className="fa-brands fa-steam" /></NavLink>
        else return <span className={highlightBaseline != null ? (dataItem[fieldKey] > highlightBaseline ? 'green' : dataItem[fieldKey] == highlightBaseline ? '' : 'red') : ''} key={fieldIndex}>{innerText}</span>
    }

    const handleSort = (field, type) => {
        sortState.value = { field, isAscending: sortState.value.field == field ? !sortState.value.isAscending : false }

        const compare = (a, b, key, isAscending) => {
            if (a[key] == null) return 1;
            if (b[key] == null) return -1;

            const multiplier = isAscending ? 1 : -1;
            if (type == 'number' || field == 'id') return (a[key] - b[key]) * multiplier;
            if (type == 'date') return (new Date(a[key]) - new Date(b[key])) * multiplier;
            if (type == 'text') return a[key].localeCompare(b[key]) * multiplier;

            return 0;
        }

        data.value = [...data.value].sort((a, b) => compare(a, b, field, sortState.value.isAscending))
    }

    const headerField = (label, type, path, sortable, className, fieldIndex) => {
        const fieldKey = path || label

        if (label == 'button' || label == 'market-page') return <i className={className} key={fieldIndex} />
        else return <span
            className={(sortState && sortable) && (sortState.value.field == fieldKey ? 'blue' : '')}
            style={{ cursor: (sortState && sortable) && 'pointer' }}
            onClick={() => (sortState && sortable) && handleSort(fieldKey, type)}
            key={fieldIndex}
        >
            {splitCamelCase(label)}
        </span>
    }

    const calculateRowValues = useComputed(() => {
        if (!calculate) return null;

        let result = {}

        for (let i in columns) {
            let fields = columns[i].fields

            for (let j in fields) {
                let { label, path, calculate, toFixed } = fields[j]
                let fieldKey = path || label

                if (calculate == 'addition') result[fieldKey] = +(data.value.reduce((t, c) => big(t).plus(c[fieldKey]), 0)).toFixed(2) 
                else if (calculate == 'average') result[fieldKey] = +(data.value.reduce((t, c) => big(t).plus(c[fieldKey]), 0) / data.value.length).toFixed(toFixed != undefined ? toFixed : 2)
            }
        }

        return result
    })

    const ToolTipWrapper = ({ content }) => {
        if (!content) return null;
        return <ToolTip content={content} joinString=", " />
    }

    return (
        <div className="table">
            <div className="table-header">
                <div className="row">
                    {columns.map(({ columnGroupName, fields }, columnIndex) =>
                        <div className={`cell ${fields[0].label}`} key={columnIndex}>
                            {columnGroupName && <span className="column-group-name">{columnGroupName}</span>}
                            <div className="fields-container">
                                {fields.map(({ label, type, path, sortable, className }, fieldIndex) => headerField(label, type, path, sortable, className, fieldIndex))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="table-body">
                {data.value.map((dataItem, dataItemIndex) =>
                    <div className="row" key={dataItemIndex}>
                        {columns.map(({ fields, toolTip }, columnIndex) =>
                            <div className={`cell ${fields[0].label}`} key={columnIndex}>
                                <div className="fields-container">
                                    {fields.map((field, fieldIndex) => renderField(field, dataItem, fieldIndex, dataItemIndex))}
                                </div>
                                <ToolTipWrapper content={toolTip ? dataItem[toolTip.path] : null} />
                            </div>
                        )}
                    </div>
                )}

                {calculate &&
                    <div className="calculate-result-row">
                        <div className=" row">
                            {columns.map(({ fields }, columnIndex) =>
                                <div className={`cell ${fields[0].label}`} key={columnIndex}>
                                    <div className="fields-container">
                                        {fields.map((field, fieldIndex) => renderField(field, calculateRowValues.value, fieldIndex))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

/*
<Table data={ } sortState={ } calculation={ } columns={[
    { fields: [{ label: 'image', type: 'image', path: 'name' }] },
    { fields: [{ label: 'market-page', type: 'link', className: 'fa-brands fa-steam', path: 'name' }] },
    { fields: [{ label: 'quantity', type: 'number', sortable: true, calculate: 'addition' }] },
    { fields: [{ label: 'button', type: 'button', className: 'fa-solid fa-ellipsis-vertical', onClick: showInvestmentItemDetails }] }
]} />

const { label, type, path, template, dateFormatOptions, className, onClick, highlightBaseline, toFixed } = field
*/