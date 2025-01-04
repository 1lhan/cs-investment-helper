import { batch, useSignal } from '@preact/signals-react';
import { big, formatDate, monthDiff, useGetRequest } from '../utils';
import { events } from '../events';
import HeaderWithIcon from '../components/HeaderWithIcon';
import CustomSelect from '../components/CustomSelect';
import Bubbles from '../components/Bubbles';
import Table from '../components/Table';

export default function StickerApplicationNumbers() {
    const eventName = useSignal('Any')
    const variant = useSignal('Any')
    const pageMsg = useSignal(null)

    const legendsCapsuleStickers = useSignal(null)
    const challengersCapsuleStickers = useSignal(null)
    const contendersCapsuleStickers = useSignal(null)
    const tournamentSticker = useSignal(null)
    const sortState1 = useSignal({ field: null, isAscending: true })
    const sortState2 = useSignal({ field: null, isAscending: true })
    const sortState3 = useSignal({ field: null, isAscending: true })
    const tableColumns = useSignal(null)

    const fetchAndFormatData = async () => {
        if (eventName.value == 'Any' || variant.value == 'Any') return;

        batch(() => { tableColumns.value = 'loading'; pageMsg.value = null })
        let data

        try {
            const response = await useGetRequest(`get-sticker-application-numbers/${eventName.value}/${variant.value}`)
            if (!response.success) return pageMsg.value = response.msg
            data = response.data
        }
        catch (error) { return pageMsg.value = error.message || 'An error occurred while fetching sticker application numbers.' }

        const formattedDates = data.dates.map(date => formatDate(date))

        const formattedData = data.stickers.map((sticker, _) => {
            sticker.data.forEach((dataItem, dataItemIndex) => {
                sticker[`applicationNumber${dataItemIndex}`] = dataItem[0]
                sticker[`price${dataItemIndex}`] = dataItem[1]
                sticker[`stock${dataItemIndex}`] = dataItem[2]

                if (+dataItemIndex > 0) {
                    const previousDataItem = sticker.data[+dataItemIndex - 1]

                    sticker[`applicationNumberChangePct${dataItemIndex}`] = +big(+big(+big(dataItem[0]).div(previousDataItem[0])).minus(1)).times(100).toFixed(0)
                    sticker[`priceChangePct${dataItemIndex}`] = +big(+big(+big(dataItem[1]).div(previousDataItem[1])).minus(1)).times(100).toFixed(0)
                    sticker[`stockChangePct${dataItemIndex}`] = +big(+big(+big(dataItem[2]).div(previousDataItem[2])).minus(1)).times(100).toFixed(0)
                }
            })
            return sticker
        })

        batch(() => {
            legendsCapsuleStickers.value = formattedData.slice(0, 8)
            challengersCapsuleStickers.value = formattedData.slice(8, 16)
            contendersCapsuleStickers.value = formattedData.slice(16, 24)
            tournamentSticker.value = formattedData.slice(24)

            tableColumns.value = [
                { fields: [{ label: 'image', type: 'image', path: 'name' }] },
                { fields: [{ label: 'name', type: 'text' }] },
                ...(formattedDates.map((date, dateIndex) => {
                    const fields = dateIndex == 0 ?
                        [
                            { label: 'applicationNumber', type: 'number', path: `applicationNumber${dateIndex}`, sortable: true, calculate: 'addition' },
                            { label: 'price', type: 'number', path: `price${dateIndex}`, sortable: true, calculate: 'addition' },
                            { label: 'stock', type: 'number', path: `stock${dateIndex}`, sortable: true, calculate: 'addition' },
                        ]
                        :
                        [
                            { label: 'applicationNumber', type: 'number', path: `applicationNumber${dateIndex}`, sortable: true, calculate: 'addition' },
                            { label: '(%)', type: 'number', path: `applicationNumberChangePct${dateIndex}`, template: '(_r%)', sortable: true, calculate: 'average', highlightBaseline: 0, toFixed: 0 },
                            { label: 'price', type: 'number', path: `price${dateIndex}`, sortable: true, calculate: 'addition' },
                            { label: '(%)', type: 'number', path: `priceChangePct${dateIndex}`, template: '(_r%)', sortable: true, calculate: 'average', highlightBaseline: 0, toFixed: 0 },
                            { label: 'stock', type: 'number', path: `stock${dateIndex}`, sortable: true, calculate: 'addition' },
                            { label: '(%)', type: 'number', path: `stockChangePct${dateIndex}`, template: '(_r%)', sortable: true, calculate: 'average', highlightBaseline: 0, toFixed: 0 }
                        ]

                    return { columnGroupName: `${date} (${monthDiff(new Date(events.find(event => event.name == eventName.value).releaseDate), new Date(data.dates[dateIndex]))}. month)`, fields }
                }))
            ]
        })
    }

    const SectionContent = () => {
        if (pageMsg.value) return <span className="msg-box">{pageMsg.value}</span>
        if (tableColumns.value == 'loading') return <div className="bubbles-wrapper"><Bubbles /></div>
        if (Array.isArray(tableColumns.value)) {
            return (
                <>
                    <Table columns={tableColumns.value} sortState={sortState1} calculate={true} data={legendsCapsuleStickers} />
                    <Table columns={tableColumns.value} sortState={sortState2} calculate={true} data={challengersCapsuleStickers} />
                    <Table columns={tableColumns.value} sortState={sortState3} calculate={true} data={contendersCapsuleStickers} />
                    <Table columns={tableColumns.value} data={tournamentSticker} />
                </>
            )
        }
        return null
    }

    return (
        <div className="sticker-application-numbers-page container">
            <header>
                <HeaderWithIcon title="Sticker Application Numbers" iconClass="fa-regular fa-note-sticky" />
                <div className="filters">
                    <CustomSelect title="Event Name" state={eventName} options={['Shanghai 2024', 'Copenhagen 2024', 'Paris 2023']} />
                    <CustomSelect title="Variant" state={variant} options={['Glitter', 'Holo']} />
                    <button className="btn" disabled={tableColumns.value == 'loading'} onClick={() => fetchAndFormatData()}><i className="fa-solid fa-magnifying-glass" /></button>
                </div>
            </header>
            <section>
                <SectionContent />
            </section>
        </div>
    )
}