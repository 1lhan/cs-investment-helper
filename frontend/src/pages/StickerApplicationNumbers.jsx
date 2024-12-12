import { batch, useSignal } from '@preact/signals-react';
import { events } from '../events';
import CustomSelect from '../components/CustomSelect';
import Table from '../components/Table';

export default function StickerApplicationNumbers({ green, red }) {
    const eventName = useSignal('Any')
    const variant = useSignal('Any')

    const data = useSignal(null)
    const capsuleStatistics = useSignal(null)
    const tableFields = useSignal(null)
    const sortValue = useSignal({ name: 'id', value: true })

    const currentDataFilterValues = useSignal(null)
    const pageMsg = useSignal(null)

    const fetchStickerApplicationNumbers = async () => {
        if ((eventName.value == 'Any' && variant.value == 'Any') || (currentDataFilterValues.value && currentDataFilterValues.value.eventName == eventName.value && currentDataFilterValues.value.variant == variant.value)) return;
        currentDataFilterValues.value = { eventName: eventName.value, variant: variant.value }

        const calculateChangePercentage = (num1, num2) => +(((num1 / num2) - 1) * 100).toFixed(0)

        let _data
        try {
            let response = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/get-sticker-application-numbers/${eventName.value}/${variant.value}`)
            if (!response.ok) throw new Error('Failed to fetch data.')

            const responsedData = await response.json()
            if (!responsedData.success) return pageMsg.value = response.msg

            _data = responsedData.data
        }
        catch (error) { return pageMsg.value = error.message || 'An error occurred while fetching sticker application numbers.' }
        const event = events.find(event => event.name == eventName.value)

        const formattedDates = _data.dates.map(date => new Intl.DateTimeFormat(navigator.language, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date)))

        let _formattedData = []
        let _capsuleStatistics = []

        for (let i in _data.stickers) {
            let sticker = _data.stickers[i]
            _formattedData.push({ id: +i + 1, name: sticker.name })

            for (let dateIndex in formattedDates) {
                let stickerApplicationNumber = sticker.data[dateIndex][0]
                let price = sticker.data[dateIndex][1]
                let stock = sticker.data[dateIndex][2]

                _formattedData[i][`stickerApplicationNumber-${dateIndex}`] = stickerApplicationNumber
                _formattedData[i][`price-${dateIndex}`] = price
                _formattedData[i][`stock-${dateIndex}`] = stock

                if (dateIndex > 0) {
                    let previousItem = sticker.data[dateIndex - 1]

                    _formattedData[i][`stickerApplicationNumberChange-${dateIndex}`] = calculateChangePercentage(stickerApplicationNumber, previousItem[0])
                    _formattedData[i][`priceChange-${dateIndex}`] = calculateChangePercentage(price, previousItem[1])
                    _formattedData[i][`stockChange-${dateIndex}`] = calculateChangePercentage(stock, previousItem[2])

                    if (i < _data.stickers.length - 1 && dateIndex >= formattedDates.length - 2) {
                        let dateIndexControl = dateIndex == formattedDates.length - 1
                        let capsuleIndex = Math.ceil((+i + 1) / 8) - 1

                        if ((+i + 1) % 8 == 1 && !dateIndexControl) {
                            _capsuleStatistics.push({ capsuleName: event.items.capsule[capsuleIndex], stickerApplicationNumber: 0, stickerApplicationNumberChange: 0, price: 0, priceChange: 0, stock: 0, stockChange: 0 })
                        }

                        _capsuleStatistics[capsuleIndex][dateIndexControl ? 'stickerApplicationNumber' : 'stickerApplicationNumberChange'] += stickerApplicationNumber
                        _capsuleStatistics[capsuleIndex][dateIndexControl ? 'price' : 'priceChange'] += price
                        _capsuleStatistics[capsuleIndex][dateIndexControl ? 'stock' : 'stockChange'] += stock

                        if ((+i + 1) % 8 == 0 && dateIndex == formattedDates.length - 1) {
                            _capsuleStatistics[capsuleIndex].stickerApplicationNumberChange =
                                calculateChangePercentage(_capsuleStatistics[capsuleIndex].stickerApplicationNumber, _capsuleStatistics[capsuleIndex].stickerApplicationNumberChange)
                            _capsuleStatistics[capsuleIndex].priceChange = calculateChangePercentage(_capsuleStatistics[capsuleIndex].price, _capsuleStatistics[capsuleIndex].priceChange)
                            _capsuleStatistics[capsuleIndex].stockChange = calculateChangePercentage(_capsuleStatistics[capsuleIndex].stock, _capsuleStatistics[capsuleIndex].stockChange)
                        }
                    }
                }
            }
        }

        let _tableFields = [
            { fields: [{ name: 'id', type: 'number', sortable: true }] },
            { fields: [{ name: 'image', type: 'image', path: 'name' }] },
            { fields: [{ name: 'name', type: 'text' }] },
            ...(formattedDates.map((date, dateIndex) => {
                return {
                    groupName: date,
                    fields: [
                        { name: 'applicationNumber', type: 'number', path: `stickerApplicationNumber-${dateIndex}`, sortable: true, calculate: 'addition' },
                        { name: '(%)', type: 'number', path: `stickerApplicationNumberChange-${dateIndex}`, template: '(_r%)', sortable: true, calculate: 'average', highlightBaseline: 0 },
                        { name: 'stock', type: 'number', path: `stock-${dateIndex}`, sortable: true, calculate: 'addition' },
                        { name: '(%)', type: 'number', path: `stockChange-${dateIndex}`, template: '(_r%)', sortable: true, calculate: 'average', highlightBaseline: 0 },
                        { name: 'price', type: 'number', path: `price-${dateIndex}`, sortable: true, calculate: 'addition' },
                        { name: '(%)', type: 'number', path: `priceChange-${dateIndex}`, template: '(_r%)', sortable: true, calculate: 'average', highlightBaseline: 0 }
                    ]
                }
            }))
        ]

        batch(() => {
            tableFields.value = _tableFields
            data.value = _formattedData
            if (_capsuleStatistics.length > 0) capsuleStatistics.value = _capsuleStatistics
            pageMsg.value = null
        })
    }

    const Filters = () => {
        return (
            <div className="filters">
                <CustomSelect id="event-name" title="Event Name" state={eventName} options={['Copenhagen 2024', 'Paris 2023']} />
                <CustomSelect id="variant" title="Variant" state={variant} options={['Glitter', 'Holo']} />
                <button className="btn" onClick={() => fetchStickerApplicationNumbers()}><i className="fa-solid fa-magnifying-glass" /></button>
            </div>
        )
    }

    const CapsuleStatistics = () => {
        if (!capsuleStatistics.value) return null;

        return (
            <div className="capsule-statistics">
                {capsuleStatistics.value.map((item, index) =>
                    <div className="capsule-statistics-item" key={index}>
                        <img src={`https://api.steamapis.com/image/item/730/${item.capsuleName}`} />
                        <div className="capsule-statistics-item-details">
                            {['stickerApplicationNumber', 'price', 'stock'].map((field, fieldIndex) =>
                                <div key={fieldIndex}>
                                    <i className={fieldIndex == 0 ? "fa-regular fa-note-sticky" : fieldIndex == 1 ? "fa-solid fa-dollar-sign" : "fa-solid fa-boxes-stacked"} />
                                    <span>{new Intl.NumberFormat(navigator.language, { maximumFractionDigits: 2 }).format(item[field]).replaceAll(',', '.')}</span>
                                    <span style={{ color: item[`${field}Change`] > 0 ? green : item[`${field}Change`] < 0 ? red : "" }}>{`(${item[`${field}Change`]}%)`}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const Section = () => {
        if (pageMsg.value) return <span className="page-msg-box">{pageMsg.value}</span>
        else if (tableFields.value) {
            return (
                <section>
                    <CapsuleStatistics />
                    <Table data={data} sortState={sortValue} calculate={true} fields={tableFields.value} />
                </section>
            )
        }
        else return null;
    }

    return (
        <div className="sticker-application-numbers-page container">
            <header>
                <div className="page-name">
                    <div className="icon-wrapper">
                        <i className="fa-regular fa-note-sticky" />
                    </div>
                    <span>Sticker Application Numbers</span>
                </div>

                <Filters />
            </header>
            <Section />
        </div>
    )
}