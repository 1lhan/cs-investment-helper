import LineChart from '../components/LineChart'

export default function InvestmentStats({ user }) {
    if (!user.value) return <div className="page-msg-box">Please log in to view investment stats</div>

    return (
        <div className="investment-stats-page container">
            <header>
                <div className="page-name">
                    <div className="icon-wrapper">
                        <i className="fa-solid fa-chart-line" />
                    </div>
                    <span>Investment Stats</span>
                </div>
            </header>
            <section>
                <LineChart id="investment-valuation-history-chart" xKey={0} yKeys={[1, 2]} data={[...user.value.investmentValuationHistory.map(item => item.slice(0, 3))]} keyNames={{ 0: "Date", 1: "cost", 2: "value" }}
                    useSameYAxisValues={true} />
            </section>
        </div>
    )
}