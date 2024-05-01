export default function Home() {

    const appliedStickerNumbers = [
        {
            tournamentName: "Copenhagen-2024",
            data: [
                {
                    date: new Date(),
                    stickers: [
                        {
                            stickerName: 'Sticker | MOUZ | Copenhagen 2024',
                            appliedNumbers: {
                                Glitter: 1000,
                                Holo: 250
                            }
                        }
                    ]
                }
            ]
        }
    ]

    const testfetch = async () => {
        let data = await fetch("https://steamcommunity.com/market/pricehistory/?appid=730&currency=1&format=json&market_hash_name=Sticker | G2 Esports | Paris 2023", {
            headers: { 'Cookie': 'steamLoginSecure=' + document.cookie+ ';' }}).then(res => res.json())
        console.log(data)
    }

    return (
        <div className="home-page container">
            <button onClick={() => testfetch()}>test</button>
        </div>
    )
}