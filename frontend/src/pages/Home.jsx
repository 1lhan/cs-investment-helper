import currentEventBanner from '../images/pgl_copenhagen_major_2024_banner.webp'

export default function Home() {
    return (
        <div className="home-page container">
            <div className='current-event-banner-wrapper'>
                <h1>PGL Copehagen Major 2024</h1>
                <img className='current-event-banner' src={currentEventBanner}/>
            </div>
        </div>
    )
}