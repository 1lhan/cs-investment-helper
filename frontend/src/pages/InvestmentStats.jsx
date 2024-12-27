import HeaderWithIcon from '../components/HeaderWithIcon';
import LineChart from '../components/LineChart';

export default function InvestmentStats({ user }) {
    if (!user.value) return <span className="msg-box" style={{ margin: '1rem auto' }}>Please log in to view investment stats</span>

    return (
        <div className="investment-stats-page container">
            <header>
                <HeaderWithIcon title="Investment Stats" iconClass="fa-solid fa-chart-line" />
            </header>
            <section>
                <LineChart id="investment-valuation-history-chart" xKey={0} yKeys={[1, 2]} keyNames={{ 0: 'Date', 1: 'Cost', 2: 'Value' }} useSameYAxisValues={true}
                    data={[...user.value.investmentValuationHistory.map(item => item = item.slice(0, 3))]} />
            </section>
        </div>
    )
}