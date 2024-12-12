import { useSignal } from '@preact/signals-react'
import Table from '../components/Table'
import { events } from '../events'

export default function Events() {
    const calculateDayDifference = (date1, date2) => (date1.setHours(0, 0, 0, 0) - date2.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24);

    const formattedEvents = events.map(event => {
        if (event.type == 'tournament') {
            if (event.tournamentStartDate) {
                event.diff1 = calculateDayDifference(event.tournamentStartDate, event.releaseDate)
                if (event.tournamentEndDate) event.diff2 = calculateDayDifference(event.tournamentEndDate, event.tournamentStartDate)
                if (event.saleStartDate) event.diff3 = calculateDayDifference(event.saleStartDate, event.tournamentEndDate)
            }
            if (event.endDate) event.diff4 = calculateDayDifference(event.endDate, event.saleStartDate)
        }
        event.diff5 = calculateDayDifference(event.endDate || new Date(), event.releaseDate)
        return event
    })

    const eventsSignal = useSignal(formattedEvents)
    const sortValue = useSignal({ name: 'releaseDate', value: false })

    const TableSection = () => {
        return (
            <>
                {eventsSignal.value && <Table data={eventsSignal} sortState={sortValue}
                    fields={[
                        { fields: [{ name: 'image', type: 'image', path: 'eventImage' }] },
                        { fields: [{ name: 'eventName', type: 'text', path: 'name' }] },
                        {
                            toolTip: { type: 'date', dateFormat: 2, path: 'releaseDate', template: 'UTC: _r' },
                            fields: [{ name: 'releaseDate', type: 'date', dateFormat: 1, sortable: true }]
                        },
                        { fields: [{ name: '-', type: 'number', path: 'diff1' }] },
                        {
                            toolTip: { type: 'date', dateFormat: 2, path: 'tournamentStartDate', template: 'UTC: _r' },
                            fields: [{ name: 'tournamentStartDate', type: 'date', dateFormat: 1 }]
                        },
                        { fields: [{ name: '-', type: 'number', path: 'diff2' }] },
                        {
                            toolTip: { type: 'date', dateFormat: 2, path: 'tournamentEndDate', template: 'UTC: _r' },
                            fields: [{ name: 'tournamentEndDate', type: 'date', dateFormat: 1 }]
                        },
                        { fields: [{ name: '-', type: 'number', path: 'diff3' }] },
                        {
                            toolTip: { type: 'date', dateFormat: 2, path: 'saleStartDate', template: 'UTC: _r' },
                            fields: [{ name: 'saleStartDate', type: 'date', dateFormat: 1 }]
                        },
                        { fields: [{ name: '-', type: 'number', path: 'diff4', sortable: true }] },
                        {
                            toolTip: { type: 'date', dateFormat: 2, path: 'endDate', template: 'UTC: _r' },
                            fields: [{ name: 'endDate', type: 'date', dateFormat: 1 }]
                        },
                        { fields: [{ name: '+', type: 'number', path: 'diff5', sortable: true }] }
                    ]}
                />}
            </>
        )
    }

    return (
        <div className="events-page container">
            <header>
                <div className="page-name">
                    <div className="icon-wrapper">
                        <i className="fa-solid fa-calendar-days" />
                    </div>
                    <span>Events</span>
                </div>
            </header>
            <section>
                <TableSection />
            </section>
        </div>
    )
}