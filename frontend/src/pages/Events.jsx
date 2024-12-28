import { useSignal } from '@preact/signals-react';
import { events } from '../events';
import HeaderWithIcon from '../components/HeaderWithIcon';
import Table from '../components/Table';

export default function Events() {
    const calculateDayDifference = (date1, date2) => (date1.setHours(0, 0, 0, 0) - date2.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)

    const formattedEvents = events.map(event => {
        if (event.type == 'tournament') {
            if (event.tournamentStartDate) event.releaseToTournamentStartDays = calculateDayDifference(event.tournamentStartDate, event.releaseDate)
            if (event.tournamentEndDate) event.tournamentDuration = calculateDayDifference(event.tournamentEndDate, event.tournamentStartDate)
            if (event.saleStartDate && event.tournamentEndDate) event.tournamentEndToSaleStartDays = calculateDayDifference(event.saleStartDate, event.tournamentEndDate)
            if (event.endDate) event.saleDuration = calculateDayDifference(event.endDate, event.saleStartDate)
        }

        event.eventDuration = calculateDayDifference(event.endDate || new Date(), event.releaseDate)

        return event
    })
    
    const eventsSignal = useSignal(formattedEvents)
    const sortState = useSignal({ field: 'releaseDate', isAscending: false })

    return (
        <div className="events-page container">
            <header>
                <HeaderWithIcon title="Events" iconClass="fa-solid fa-calendar-days" />
            </header>
            <section>
                <Table data={eventsSignal} sortState={sortState} columns={[
                    { fields: [{ label: 'image', type: 'image', path: 'eventImage' }] },
                    { fields: [{ label: 'name', type: 'text' }] },
                    { fields: [{ label: 'releaseDate', type: 'date', sortable: true }] },
                    { fields: [{ label: '-', type: 'number', path: 'releaseToTournamentStartDays', sortable: true }] },
                    { fields: [{ label: 'tournamentStartDate', type: 'date', sortable: true }] },
                    { fields: [{ label: '-', type: 'number', path: 'tournamentDuration', sortable: true }] },
                    { fields: [{ label: 'tournamentEndDate', type: 'date', sortable: true }] },
                    { fields: [{ label: '-', type: 'number', path: 'tournamentEndToSaleStartDays', sortable: true }] },
                    { fields: [{ label: 'saleStartDate', type: 'date', sortable: true }] },
                    { fields: [{ label: '-', type: 'number', path: 'saleDuration', sortable: true }] },
                    { fields: [{ label: 'endDate', type: 'date', sortable: true }] },
                    { fields: [{ label: '+', type: 'number', path: 'eventDuration', sortable: true }] },
                ]} />
            </section>
        </div>
    )
}