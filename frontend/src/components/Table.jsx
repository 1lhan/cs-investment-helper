import { useComputed } from "@preact/signals-react"
import ToolTip from "./ToolTip";

export default function Table({ data, sortState, calculate, fields }) {
    const blue = '#066edd'
    const green = '#34d399';
    const red = '#ff6c6c';

    const additionResultRow = useComputed(() => {
        if (calculate) {
            let result = {}
            fields.map(({ fields }, _) =>
                fields.map(({ name, path, calculate }, _) => {
                    if (calculate == "addition") result[path || name] = +(data.value.reduce((t, c) => { return t + c[path || name] }, 0)).toFixed(2)
                    else if (calculate == "average") result[path || name] = +(data.value.reduce((t, c) => { return t + c[path || name] }, 0) / data.value.length).toFixed(0)
                })
            )
            return result;
        }
    })

    const insideCellRenderHandler = (field, dataItem, fieldIndex, dataItemIndex) => {
        let { name, type, path, template, dateFormat, className, onClick, highlightBaseline } = field
        let innerText = dataItem[path || name]

        if (innerText == null && type != 'button') return;

        if (type == 'number') innerText = new Intl.NumberFormat(navigator.language, { maximumFractionDigits: 2 }).format(innerText).replaceAll(',', '.')
        if (type == 'date') innerText = new Intl.DateTimeFormat(navigator.language, {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: dateFormat == 1 ? undefined : '2-digit', minute: dateFormat == 1 ? undefined : '2-digit', timeZone: dateFormat == 1 ? undefined : 'UTC'
        }).format(new Date(innerText))
        if (template) innerText = template.replace('_r', innerText)

        if (type == 'image') return <img src={`https://api.steamapis.com/image/item/730/${innerText}`} key={fieldIndex} />
        else if (type == 'array') return dataItem[path || name].map(item => item.join(', '))
        else if (type == 'button') return <i className={className} onClick={() => onClick(dataItemIndex)} key={fieldIndex} />
        else return <span key={fieldIndex} style={{ ...(highlightBaseline != null && { color: dataItem[path || name] > highlightBaseline ? green : dataItem[path || name] == highlightBaseline ? '' : red }) }}>{innerText}</span>
    }

    const sortHandler = (_name, _type) => {
        sortState.value = { name: _name, value: sortState.value.name == _name ? !sortState.value.value : true }
        let sortedData = data.value.slice()

        if (_name == 'id' || _type == 'number') {
            sortedData.sort((a, b) => {
                if (['diff4'].includes(_name)) {
                    if (a[_name] == null) return 1
                    if (b[_name] == null) return -1
                }
                return sortState.value.value ? a[_name] - b[_name] : b[_name] - a[_name]
            })
        }
        else if (_type == 'date') sortedData.sort((a, b) => { return sortState.value.value ? new Date(a[_name]) - new Date(b[_name]) : new Date(b[_name]) - new Date(a[_name]) })
        else if (_type == 'text') sortedData.sort((a, b) => { return sortState.value.value ? a[_name].localeCompare(b[_name]) : b[_name].localeCompare(a[_name]) })

        data.value = sortedData;
    }

    return (
        <div className="table">
            <div className="table-header row">
                {fields.map(({ groupName, fields }, cellIndex) =>
                    <div className={`cell ${fields[0].name}`} key={cellIndex}>
                        {groupName && <div className="cell-inner"><span>{groupName}</span></div>}
                        <div className="cell-inner">
                            {fields.map(({ name, type, path, sortable, className }, fieldIndex) =>
                                <span
                                    style={{ cursor: sortable ? 'pointer' : '', ...(sortable && { color: sortState.value.name == (path || name) && blue }) }}
                                    onClick={() => sortable && sortHandler(path || name, type)}
                                    key={fieldIndex}
                                >
                                    {name == "button" ? <i className={className} /> : name.replace(/([a-z])([A-Z])/g, '$1 $2')}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="table-body">
                {data.value.map((dataItem, dataItemIndex) =>
                    <div className="row" key={dataItemIndex}>
                        {fields.map(({ toolTip, fields }, cellIndex) =>
                            <div className={`cell ${fields[0].name}`} key={cellIndex}>
                                <div className="cell-inner">
                                    {fields.map((field, fieldIndex) => insideCellRenderHandler(field, dataItem, fieldIndex, dataItemIndex))}
                                </div>
                                {(toolTip && dataItem[fields[0].path || fields[0].name]) && <ToolTip content={insideCellRenderHandler(toolTip, dataItem)} />}
                            </div>
                        )}
                    </div>
                )}

                {calculate &&
                    <div className="row addition-result-row">
                        {fields.map(({ fields }, cellIndex) =>
                            <div className={`cell ${fields[0].name}`} key={cellIndex}>
                                <div className="cell-inner">
                                    {fields.map((field, fieldIndex) => insideCellRenderHandler(field, additionResultRow.value, fieldIndex))}
                                </div>
                            </div>
                        )}
                    </div>
                }
            </div>
        </div>
    )
}
/*
const sortValue = useSignal({ name: 'id', value: true }) // if it is true that is mean low to high
<Table data={_events} sortState={sortValue} calculate={false}
    fields={[
        { fields: [{ name: 'image', type: 'image', path: 'eventImage' }] },
        { fields: [{ name: 'eventName', type: 'text', path: 'name' }] },
        { fields: [{ name: 'x', type: 'number', sortable: true, highlightValue: true, highlightBaseline: 0, calculate:"average" }] },
        {
            toolTip: { type: 'date', dateFormat: 2, path: 'releaseDate', template: 'UTC: _r' },
            fields: [{ name: 'releaseDate', type: 'date', dateFormat: 1, sortable: true }]
        },
        { fields: [{ name: 'button', type: 'button', className: "fa-regular fa-trash-can", onClick: (index) => deleteItemFromTable(index) }] },
        {
            groupName: "price", fieds: [
                { name: variants.value[0], type: "number", path: "priceVariant0" },
                { name: variants.value[1], type: "number", path: "priceVariant1" },
                { name: variants.value[2], type: "number", path: "priceVariant2" },
                { name: variants.value[3], type: "number", path: "priceVariant3" }
            ]
        },
    ]}
/>
*/