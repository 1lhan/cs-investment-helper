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
                <div className="section-inner template-style-wrapper">
                    <div className="field-names">
                        <span className="image">Img</span>
                        <span className="field-names-item item-name">Event Name</span>
                        <span className="field-names-item">Release Date</span>
                        <span className="field-names-item time-difference">-</span>
                        <span className="field-names-item">Tournament Start</span>
                        <span className="field-names-item time-difference">-</span>
                        <span className="field-names-item">Tournament End</span>
                        <span className="field-names-item time-difference">-</span>
                        <span className="field-names-item">Sale Start</span>
                        <span className="field-names-item time-difference" style={{ color: green }}>-</span>
                        <span className="field-names-item">End Date</span>
                        <span className="field-names-item time-difference" style={{ color: green }}>+</span>
                    </div>
                    {events.slice().sort((a, b) => new Date(b.dates.release) - new Date(a.dates.release)).map((event, index) =>
                        event.eventType == 'tournament' ?
                            <div className="item-div" key={index}>
                            <div className="image-wrapper">
                                <img className="image" src={'https://api.steamapis.com/image/item/730/' + event.eventItem} />
                                <div className="tool-tip mobile-size-tool-tip tool-tip-from-left">
                                    <span>{event.name.replaceAll('-', ' ')}</span>
                                </div>
                            </div>
                                <span className="item-div-children item-name">{event.name.replaceAll('-', ' ')}</span>
                                <span className="item-div-children">{event.dates['release']}</span>
                                <span className="item-div-children time-difference">{event.dates['tournament-start'] && (new Date(event.dates['tournament-start']) - new Date(event.dates['release'])) / (1000 * 60 * 60 * 24)}</span>
                                <span className="item-div-children">{event.dates['tournament-start'] && event.dates['tournament-start']}</span>
                                <span className="item-div-children time-difference">{event.dates['tournament-start'] && (new Date(event.dates['tournament-end']) - new Date(event.dates['tournament-start'])) / (1000 * 60 * 60 * 24)}</span>
                                <span className="item-div-children">{event.dates['tournament-end'] && event.dates['tournament-end']}</span>
                                <span className="item-div-children time-difference">{event.dates['tournament-end'] && (new Date(event.dates['sale-start']) - new Date(event.dates['tournament-end'])) / (1000 * 60 * 60 * 24)}</span>
                                <span className="item-div-children">{event.dates['sale-start']}</span>
                                <span className="item-div-children time-difference" style={{ color: green }}>{(new Date(event.dates['sale-end']) - new Date(event.dates['sale-start'])) / (1000 * 60 * 60 * 24)}</span>
                                <span className="item-div-children">{event.dates['sale-end']}</span>
                                <span className="item-div-children time-difference" style={{ color: green }}>{(new Date(event.dates['sale-end']) - new Date(event.dates['release'])) / (1000 * 60 * 60 * 24)}</span>
                            </div>
                            :
                            <div className="item-div" key={index}>
                            <div className="image-wrapper">
                                <img className="image" src={'https://api.steamapis.com/image/item/730/' + event.eventItem} />
                                <div className="tool-tip mobile-size-tool-tip tool-tip-from-left">
                                    <span>{event.name.replaceAll('-', ' ')}</span>
                                </div>
                            </div>
                                <span className="item-div-children item-name">{event.name.replaceAll('-', ' ')}</span>
                                <span className="item-div-children">{event.dates['release']}</span>
                                <span className="item-div-children time-difference"></span>
                                <span className="item-div-children"></span>
                                <span className="item-div-children time-difference"></span>
                                <span className="item-div-children"></span>
                                <span className="item-div-children time-difference"></span>
                                <span className="item-div-children"></span>
                                <span className="item-div-children time-difference"></span>
                                <span className="item-div-children">{event.dates['end']}</span>
                                <span className="item-div-children time-difference" style={{ color: green }}>{(new Date(event.dates['end']) - new Date(event.dates['release'])) / (1000 * 60 * 60 * 24)}</span>
                            </div>
                    )}
                </div>
            </section>
        </div>
    )
}