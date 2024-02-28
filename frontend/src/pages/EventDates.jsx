import { useSelector } from "react-redux"
import { dynamicTitle } from "../utils"

export default function EventDates() {
    const { events, green } = useSelector(state => state.slice)

    dynamicTitle(window.location.pathname.slice(1).replaceAll('-', ' '))

    return (
        <div className="event-dates-page container">
            <div className="top-div">
                <h2><i className="fa-solid fa-calendar-days" />Event Dates</h2>
            </div>
            <section>
                <div className="section-inner">

                    <div className="field-names">
                        <span className="image">Img</span>
                        <span className="field-names-item event-name">Event Name</span>
                        <span className="field-names-item">Release Date</span>
                        <span className="time-difference-span">-</span>
                        <span className="field-names-item">Tournament Start</span>
                        <span className="time-difference-span">-</span>
                        <span className="field-names-item">Tournament End</span>
                        <span className="time-difference-span">-</span>
                        <span className="field-names-item">Sale Start</span>
                        <span className="time-difference-span" style={{ color: green }}>-</span>
                        <span className="field-names-item">End Date</span>
                        <span className="time-difference-span" style={{ color: green }}>+</span>
                    </div>
                    {events.slice().sort((a, b) => new Date(b.dates.release) - new Date(a.dates.release)).map((event, index) =>
                        event.eventType == 'tournament' ?
                            <div className="section-item" key={index}>
                                <img className="image" src={'https://api.steamapis.com/image/item/730/' + event.eventItem} />
                                <span className="section-item-children event-name">{event.name.replaceAll('-', ' ')}</span>
                                <span className="section-item-children">{event.dates['release']}</span>
                                <span className="time-difference-span">{event.dates['tournament-start'] && (new Date(event.dates['tournament-start']) - new Date(event.dates['release'])) / (1000 * 60 * 60 * 24)}</span>
                                <span className="section-item-children">{event.dates['tournament-start'] && event.dates['tournament-start']}</span>
                                <span className="time-difference-span">{event.dates['tournament-start'] && (new Date(event.dates['tournament-end']) - new Date(event.dates['tournament-start'])) / (1000 * 60 * 60 * 24)}</span>
                                <span className="section-item-children">{event.dates['tournament-end'] && event.dates['tournament-end']}</span>
                                <span className="time-difference-span">{event.dates['tournament-end'] && (new Date(event.dates['sale-start']) - new Date(event.dates['tournament-end'])) / (1000 * 60 * 60 * 24)}</span>
                                <span className="section-item-children">{event.dates['sale-start']}</span>
                                <span className="time-difference-span" style={{ color: green }}>{(new Date(event.dates['sale-end']) - new Date(event.dates['sale-start'])) / (1000 * 60 * 60 * 24)}</span>
                                <span className="section-item-children">{event.dates['sale-end']}</span>
                                <span className="time-difference-span" style={{ color: green }}>{(new Date(event.dates['sale-end']) - new Date(event.dates['release'])) / (1000 * 60 * 60 * 24)}</span>
                            </div>
                            :
                            <div className="section-item" key={index}>
                                <img className="image" src={'https://api.steamapis.com/image/item/730/' + event.eventItem} />
                                <span className="section-item-children event-name">{event.name.replaceAll('-', ' ')}</span>
                                <span className="section-item-children">{event.dates['release']}</span>
                                <span className="time-difference-span"></span>
                                <span className="section-item-children"></span>
                                <span className="time-difference-span"></span>
                                <span className="section-item-children"></span>
                                <span className="time-difference-span"></span>
                                <span className="section-item-children"></span>
                                <span className="time-difference-span"></span>
                                <span className="section-item-children">{event.dates['end']}</span>
                                <span className="time-difference-span" style={{ color: green }}>{(new Date(event.dates['end']) - new Date(event.dates['release'])) / (1000 * 60 * 60 * 24)}</span>
                            </div>
                    )}
                </div>
            </section>
        </div>
    )
}